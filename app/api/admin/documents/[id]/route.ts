import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getDocument,
  updateDocumentStatus,
  deleteDocument,
  saveDocument,
  type DocumentStatus,
} from '@/lib/documentManager'
import { getPineconeIndex, listAllVectorIds } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/textUtils'
import { createJob, updateJobProgress, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'

/**
 * OPTIONS - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// GET single document
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const document = await getDocument(id)

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, document })
  } catch (error: any) {
    console.error('Get document error:', error)
    return NextResponse.json({ error: 'Failed to get document' }, { status: 500 })
  }
}

// PATCH update document status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { status, notes, extractedText } = await req.json()

    if (!status || !['draft', 'review', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const document = await getDocument(id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If extractedText is provided, update the document's text and re-chunk
    if (extractedText && extractedText !== document.extractedText) {
      console.log('[Update] Updating extracted text and re-chunking')
      document.extractedText = extractedText
      document.chunks = chunkText(extractedText)
      document.metadata.wordCount = extractedText.split(/\s+/).filter(Boolean).length
      console.log('[Update] Re-chunked into', document.chunks.length, 'chunks')

      // Save the updated document
      await saveDocument(document)
    }

    // If approving, generate embeddings and add to Pinecone
    if (status === 'approved' && document.status !== 'approved') {
      const jobId = `doc-${id}`

      try {
        console.log('[Approve] Creating embeddings for document:', document.id)
        console.log('[Approve] Document has', document.chunks?.length || 0, 'chunks')

        // Create job tracker
        await createJob(jobId, 'document-approval', document.chunks.length)

        const index = await getPineconeIndex()
        const pineconeIds: string[] = []

        // Generate embeddings for each chunk
        for (let i = 0; i < document.chunks.length; i++) {
          const chunk = document.chunks[i]
          console.log(`[Approve] Processing chunk ${i + 1}/${document.chunks.length}`)

          // Update progress
          await updateJobProgress(
            jobId,
            i + 1,
            `Processing chunk ${i + 1}/${document.chunks.length}`
          )

          const embedding = await createEmbedding(chunk)

          const vectorId = `${document.id}_chunk_${i}`
          await index.upsert([
            {
              id: vectorId,
              values: embedding,
              metadata: {
                title: document.fileName,
                content: chunk, // Store FULL chunk content (not truncated)
                description: chunk.substring(0, 500), // Keep for backward compatibility
                type: 'document', // Vector type for categorization
                vectorType: 'document', // Explicit field for filtering
                fileType: document.fileType,
                chunkIndex: i,
                totalChunks: document.chunks.length,
                documentId: document.id,
                uploadedAt: document.uploadedAt,
                uploadedBy: document.uploadedBy,
              },
            },
          ])

          pineconeIds.push(vectorId)
        }

        console.log('[Approve] Successfully added', pineconeIds.length, 'vectors to Pinecone')

        // Update document with Pinecone IDs
        document.pineconeIds = pineconeIds

        // Complete job
        await completeJob(jobId, { vectorCount: pineconeIds.length })
      } catch (error: any) {
        await failJob(jobId, error.message)
        throw error
      }
    }

    // Update status
    await updateDocumentStatus(id, status as DocumentStatus, notes)

    return NextResponse.json({ success: true, jobId: status === 'approved' ? `doc-${id}` : undefined })
  } catch (error: any) {
    console.error('Update document error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update document' }, { status: 500 })
  }
}

// DELETE document
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const document = await getDocument(id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If approved, remove from Pinecone
    if (document.status === 'approved') {
      console.log('[Delete] Document is approved, removing from Pinecone')
      const index = await getPineconeIndex()

      if (document.pineconeIds && document.pineconeIds.length > 0) {
        console.log('[Delete] Deleting', document.pineconeIds.length, 'vectors from Pinecone')
        await index.deleteMany(document.pineconeIds)
        console.log('[Delete] Pinecone vectors deleted successfully')
      } else {
        // Fallback: use filter-based deletion by documentId to prevent orphan vectors
        console.warn('[Delete] No pineconeIds found, using filter-based deletion by documentId')

        try {
          // Get all document vectors matching this documentId
          const allDocVectorIds = await listAllVectorIds({ vectorType: 'document' })

          // Fetch metadata to filter by documentId
          const FETCH_BATCH_SIZE = 1000
          const vectorIdsToDelete: string[] = []

          for (let i = 0; i < allDocVectorIds.length; i += FETCH_BATCH_SIZE) {
            const batch = allDocVectorIds.slice(i, i + FETCH_BATCH_SIZE)
            const fetchResponse = await index.fetch(batch)

            for (const [vectorId, vector] of Object.entries(fetchResponse.records)) {
              if (vector.metadata?.documentId === id) {
                vectorIdsToDelete.push(vectorId)
              }
            }
          }

          if (vectorIdsToDelete.length > 0) {
            console.log(`[Delete] Found ${vectorIdsToDelete.length} orphan vectors, deleting...`)
            const DELETE_BATCH_SIZE = 100
            for (let i = 0; i < vectorIdsToDelete.length; i += DELETE_BATCH_SIZE) {
              const batch = vectorIdsToDelete.slice(i, i + DELETE_BATCH_SIZE)
              await index.deleteMany(batch)
            }
            console.log('[Delete] Orphan vectors deleted successfully')
          } else {
            console.log('[Delete] No vectors found for this document')
          }
        } catch (error) {
          console.error('[Delete] Failed to delete orphan vectors:', error)
          // Continue with document deletion even if vector cleanup fails
        }
      }
    }

    await deleteDocument(id)
    console.log('[Delete] Document deleted from storage:', id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
