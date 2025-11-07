import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getDocument,
  updateDocumentStatus,
  deleteDocument,
  type DocumentStatus,
} from '@/lib/documentManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'

export const runtime = 'nodejs'

// GET single document
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await getDocument(params.id)

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
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, notes } = await req.json()

    if (!status || !['draft', 'review', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const document = await getDocument(params.id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If approving, generate embeddings and add to Pinecone
    if (status === 'approved' && document.status !== 'approved') {
      const index = await getPineconeIndex()
      const pineconeIds: string[] = []

      // Generate embeddings for each chunk
      for (let i = 0; i < document.chunks.length; i++) {
        const chunk = document.chunks[i]
        const embedding = await createEmbedding(chunk)

        const vectorId = `${document.id}_chunk_${i}`
        await index.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              title: document.fileName,
              description: chunk.substring(0, 500),
              type: 'document',
              fileType: document.fileType,
              chunkIndex: i,
              totalChunks: document.chunks.length,
              documentId: document.id,
            },
          },
        ])

        pineconeIds.push(vectorId)
      }

      // Update document with Pinecone IDs
      document.pineconeIds = pineconeIds
    }

    // Update status
    await updateDocumentStatus(params.id, status as DocumentStatus, notes)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update document error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update document' }, { status: 500 })
  }
}

// DELETE document
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const document = await getDocument(params.id)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If approved, remove from Pinecone
    if (document.status === 'approved' && document.pineconeIds) {
      const index = await getPineconeIndex()
      await index.deleteMany(document.pineconeIds)
    }

    await deleteDocument(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
