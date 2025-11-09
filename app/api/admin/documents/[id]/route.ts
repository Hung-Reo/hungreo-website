import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getDocument,
  updateDocumentStatus,
  deleteDocument,
  saveDocument,
  type DocumentStatus,
} from '@/lib/documentManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/textUtils'

export const runtime = 'nodejs'

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
      console.log('[Approve] Creating embeddings for document:', document.id)
      console.log('[Approve] Document has', document.chunks?.length || 0, 'chunks')

      const index = await getPineconeIndex()
      const pineconeIds: string[] = []

      // Generate embeddings for each chunk
      for (let i = 0; i < document.chunks.length; i++) {
        const chunk = document.chunks[i]
        console.log(`[Approve] Processing chunk ${i + 1}/${document.chunks.length}`)
        const embedding = await createEmbedding(chunk)

        const vectorId = `${document.id}_chunk_${i}`
        await index.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              title: document.fileName,
              description: chunk.substring(0, 500),
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
    }

    // Update status
    await updateDocumentStatus(id, status as DocumentStatus, notes)

    return NextResponse.json({ success: true })
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
        // Fallback: try to delete by document ID pattern
        console.warn('[Delete] No pineconeIds found, attempting cleanup by document ID pattern')
        // Note: Pinecone doesn't support prefix deletion, so this is best-effort
        // In production, you should ensure pineconeIds are always saved
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
