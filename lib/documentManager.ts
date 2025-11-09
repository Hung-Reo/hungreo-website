/**
 * Document management with Vercel KV
 * Handles 3-stage workflow: Draft → Review → Approved
 *
 * Note: In development without Vercel KV, documents are stored in-memory only
 */

import { kv } from '@vercel/kv'
import { put } from '@vercel/blob'

// In-memory storage for development (when Vercel KV is not configured)
// Use global object to persist across hot reloads in Next.js dev mode
const globalForDocuments = global as unknown as {
  inMemoryDocs: Map<string, Document> | undefined
  inMemoryDocsByStatus: Map<string, Set<string>> | undefined
}

const inMemoryDocs: Map<string, Document> =
  globalForDocuments.inMemoryDocs ?? new Map()
const inMemoryDocsByStatus: Map<string, Set<string>> =
  globalForDocuments.inMemoryDocsByStatus ?? new Map([
    ['draft', new Set()],
    ['review', new Set()],
    ['approved', new Set()],
    ['rejected', new Set()],
  ])

// Store in global to survive hot reloads
globalForDocuments.inMemoryDocs = inMemoryDocs
globalForDocuments.inMemoryDocsByStatus = inMemoryDocsByStatus

// Check if Vercel KV is configured
function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

export type DocumentStatus = 'draft' | 'review' | 'approved' | 'rejected'

export interface Document {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  status: DocumentStatus
  uploadedAt: number
  uploadedBy: string
  extractedText: string
  chunks: string[]
  metadata: {
    pageCount?: number
    wordCount: number
  }
  blobUrl?: string // For files >4.5MB
  reviewNotes?: string
  approvedAt?: number
  rejectedAt?: number
  pineconeIds?: string[] // IDs of vectors in Pinecone
}

/**
 * Save document to Vercel KV or in-memory storage
 */
export async function saveDocument(doc: Document): Promise<void> {
  try {
    if (!isKVConfigured()) {
      // Use in-memory storage for development
      console.warn('[documentManager] Vercel KV not configured, using in-memory storage')
      inMemoryDocs.set(doc.id, doc)
      inMemoryDocsByStatus.get(doc.status)?.add(doc.id)
      return
    }

    const key = `doc:${doc.id}`
    await kv.set(key, doc)

    // Add to status list
    await kv.sadd(`docs:${doc.status}`, doc.id)

    // Add to all documents list
    await kv.zadd('docs:all', { score: doc.uploadedAt, member: doc.id })
  } catch (error) {
    console.error('Failed to save document:', error)
    throw new Error('Failed to save document')
  }
}

/**
 * Get document by ID
 */
export async function getDocument(docId: string): Promise<Document | null> {
  try {
    if (!isKVConfigured()) {
      return inMemoryDocs.get(docId) || null
    }

    const doc = await kv.get<Document>(`doc:${docId}`)
    return doc
  } catch (error) {
    console.error('Failed to get document:', error)
    return null
  }
}

/**
 * Get all documents by status
 */
export async function getDocumentsByStatus(status: DocumentStatus): Promise<Document[]> {
  try {
    if (!isKVConfigured()) {
      // Use in-memory storage
      const docIds = inMemoryDocsByStatus.get(status) || new Set()
      const docs: Document[] = []

      for (const id of docIds) {
        const doc = inMemoryDocs.get(id)
        if (doc) {
          docs.push(doc)
        }
      }

      return docs.sort((a, b) => b.uploadedAt - a.uploadedAt)
    }

    const docIds = await kv.smembers(`docs:${status}`)
    const docs: Document[] = []

    for (const id of docIds) {
      const doc = await getDocument(id as string)
      if (doc) {
        docs.push(doc)
      }
    }

    // Sort by upload date (newest first)
    return docs.sort((a, b) => b.uploadedAt - a.uploadedAt)
  } catch (error) {
    console.error('Failed to get documents by status:', error)
    return []
  }
}

/**
 * Get all documents (paginated)
 */
export async function getAllDocuments(limit: number = 50, offset: number = 0): Promise<Document[]> {
  try {
    if (!isKVConfigured()) {
      const allDocs = Array.from(inMemoryDocs.values())
      return allDocs
        .sort((a, b) => b.uploadedAt - a.uploadedAt)
        .slice(offset, offset + limit)
    }

    const docIds = await kv.zrange('docs:all', offset, offset + limit - 1, { rev: true })
    const docs: Document[] = []

    for (const id of docIds) {
      const doc = await getDocument(id as string)
      if (doc) {
        docs.push(doc)
      }
    }

    return docs
  } catch (error) {
    console.error('Failed to get all documents:', error)
    return []
  }
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  docId: string,
  newStatus: DocumentStatus,
  notes?: string
): Promise<void> {
  try {
    const doc = await getDocument(docId)
    if (!doc) {
      throw new Error('Document not found')
    }

    const oldStatus = doc.status

    // Update document
    const updatedDoc: Document = {
      ...doc,
      status: newStatus,
      reviewNotes: notes || doc.reviewNotes,
    }

    if (newStatus === 'approved') {
      updatedDoc.approvedAt = Date.now()
    } else if (newStatus === 'rejected') {
      updatedDoc.rejectedAt = Date.now()
    }

    if (!isKVConfigured()) {
      // Update in-memory storage
      inMemoryDocs.set(docId, updatedDoc)
      inMemoryDocsByStatus.get(oldStatus)?.delete(docId)
      inMemoryDocsByStatus.get(newStatus)?.add(docId)
      return
    }

    // Save updated document
    await kv.set(`doc:${docId}`, updatedDoc)

    // Update status lists
    await kv.srem(`docs:${oldStatus}`, docId)
    await kv.sadd(`docs:${newStatus}`, docId)
  } catch (error) {
    console.error('Failed to update document status:', error)
    throw new Error('Failed to update document status')
  }
}

/**
 * Delete document
 */
export async function deleteDocument(docId: string): Promise<void> {
  try {
    const doc = await getDocument(docId)
    if (!doc) {
      throw new Error('Document not found')
    }

    if (!isKVConfigured()) {
      // Remove from in-memory storage
      inMemoryDocs.delete(docId)
      inMemoryDocsByStatus.get(doc.status)?.delete(docId)
      return
    }

    // Remove from KV
    await kv.del(`doc:${docId}`)
    await kv.srem(`docs:${doc.status}`, docId)
    await kv.zrem('docs:all', docId)

    // TODO: Also remove from Pinecone when approved
  } catch (error) {
    console.error('Failed to delete document:', error)
    throw new Error('Failed to delete document')
  }
}

/**
 * Upload file to Vercel Blob (for files >4.5MB)
 */
export async function uploadToBlob(file: File): Promise<string> {
  try {
    const blob = await put(file.name, file, {
      access: 'public',
    })
    return blob.url
  } catch (error) {
    console.error('Failed to upload to Blob:', error)
    throw new Error('Failed to upload file')
  }
}

/**
 * Get document statistics
 */
export async function getDocumentStats() {
  try {
    if (!isKVConfigured()) {
      // Use in-memory storage
      return {
        draft: inMemoryDocsByStatus.get('draft')?.size || 0,
        review: inMemoryDocsByStatus.get('review')?.size || 0,
        approved: inMemoryDocsByStatus.get('approved')?.size || 0,
        rejected: inMemoryDocsByStatus.get('rejected')?.size || 0,
        total: inMemoryDocs.size,
      }
    }

    const [draftCount, reviewCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
      kv.scard('docs:draft'),
      kv.scard('docs:review'),
      kv.scard('docs:approved'),
      kv.scard('docs:rejected'),
      kv.zcard('docs:all'),
    ])

    return {
      draft: draftCount || 0,
      review: reviewCount || 0,
      approved: approvedCount || 0,
      rejected: rejectedCount || 0,
      total: totalCount || 0,
    }
  } catch (error) {
    console.error('Failed to get document stats:', error)
    return {
      draft: 0,
      review: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    }
  }
}
