import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getDocument, saveDocument } from '@/lib/documentManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/textUtils'
import { createJob, emitProgress, appendLog, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for large documents

/**
 * POST /api/admin/documents/approve
 * Approve a document and generate vectors for RAG
 */
export async function POST(req: NextRequest) {
  const jobId = `doc-approve-${Date.now()}`

  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId } = await req.json()

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    // Get document
    const document = await getDocument(documentId)
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    console.log(`[Approval] Processing document: ${document.fileName}`)

    // Get extracted text content
    const textContent = document.extractedText

    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Document has no extractable text content' },
        { status: 400 }
      )
    }

    console.log(`[Approval] Extracted ${textContent.length} characters from ${document.fileName}`)

    // Chunk the text first to know total
    const chunks = chunkText(textContent)
    console.log(`[Approval] Created ${chunks.length} chunks for ${document.fileName}`)

    // Create job tracker
    await createJob(jobId, 'document-approval', chunks.length)
    await appendLog(jobId, 'info', `Starting approval for ${document.fileName}`)
    await emitProgress(jobId, `Processing ${document.fileName}...`, 0, chunks.length)

    // Delete existing vectors if any (for re-approval case)
    const index = await getPineconeIndex()
    if (document.pineconeIds && document.pineconeIds.length > 0) {
      console.log(`[Approval] Deleting ${document.pineconeIds.length} existing vectors`)
      await appendLog(jobId, 'info', `Deleting ${document.pineconeIds.length} existing vectors`)
      try {
        await index.deleteMany(document.pineconeIds)
      } catch (error) {
        console.error('[Approval] Failed to delete existing vectors:', error)
        await appendLog(jobId, 'warn', 'Failed to delete some existing vectors')
        // Continue anyway - we'll create new vectors
      }
    }

    // Create embeddings and store in Pinecone
    const pineconeIds: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]

      try {
        await emitProgress(
          jobId,
          `Creating vector ${i + 1}/${chunks.length} for ${document.fileName}`,
          i + 1,
          chunks.length
        )

        const embedding = await createEmbedding(chunk)
        const vectorId = `doc_${documentId}_chunk_${i}`

        await index.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              documentId,
              fileName: document.fileName,
              fileType: document.fileType,
              type: 'document',
              vectorType: 'document',
              chunkIndex: i,
              totalChunks: chunks.length,
              content: chunk,
              uploadedAt: document.uploadedAt,
              uploadedBy: document.uploadedBy,
            },
          },
        ])

        pineconeIds.push(vectorId)
        console.log(`[Approval] Created vector ${i + 1}/${chunks.length} for ${document.fileName}`)
      } catch (error) {
        console.error(`[Approval] Failed to create vector ${i} for ${document.fileName}:`, error)
        await appendLog(jobId, 'error', `Failed to create vector ${i + 1}`)
        // Continue with other chunks
      }
    }

    if (pineconeIds.length === 0) {
      await failJob(jobId, 'Failed to create any vectors')
      return NextResponse.json(
        { error: 'Failed to create any vectors. Please try again.' },
        { status: 500 }
      )
    }

    // Update document with approval status and pinecone IDs
    const updatedDocument = {
      ...document,
      status: 'approved' as const,
      approvedAt: Date.now(),
      pineconeIds,
    }
    await saveDocument(updatedDocument)

    console.log(`[Approval] Successfully approved ${document.fileName} with ${pineconeIds.length} vectors`)
    await appendLog(jobId, 'info', `Created ${pineconeIds.length} vectors successfully`)

    await completeJob(jobId, {
      documentId,
      fileName: document.fileName,
      vectorsCreated: pineconeIds.length,
      chunks: chunks.length,
    })

    return NextResponse.json({
      success: true,
      jobId,
      message: `Document approved with ${pineconeIds.length} vectors`,
      vectorsCreated: pineconeIds.length,
      chunks: chunks.length,
    })
  } catch (error: any) {
    console.error('Document approval error:', error)
    await failJob(jobId, error.message || 'Failed to approve document')
    return NextResponse.json(
      { error: error.message || 'Failed to approve document' },
      { status: 500 }
    )
  }
}
