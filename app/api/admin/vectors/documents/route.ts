import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex } from '@/lib/pinecone'
import { getAllDocuments } from '@/lib/documentManager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/vectors/documents
 * Get all approved documents with their vector information
 * Query param: ?detailed=documentId to get full vector content for a specific document
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const detailedDocId = searchParams.get('detailed')

    // Get Pinecone index
    const index = await getPineconeIndex()

    // Query all document vectors to verify they exist
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0),
      topK: 10000,
      filter: { vectorType: 'document' },
      includeMetadata: true,
      includeValues: false,
    })

    // If requesting detailed view for a specific document
    if (detailedDocId) {
      const docVectors = queryResponse.matches
        .filter((match) => match.metadata?.documentId === detailedDocId)
        .map((match) => ({
          id: match.id,
          content: match.metadata?.description || '',
          chunkIndex: (match.metadata?.chunkIndex as number) || 0,
          fileName: match.metadata?.fileName || '',
        }))
        .sort((a, b) => a.chunkIndex - b.chunkIndex)

      return NextResponse.json({
        success: true,
        documentId: detailedDocId,
        vectors: docVectors,
      })
    }

    // Get all documents from KV
    const allDocs = await getAllDocuments(1000, 0)

    // Filter only approved documents (those that have vectors)
    const approvedDocs = allDocs.filter((doc) => doc.status === 'approved')

    // Map document IDs to vector counts
    const vectorCountMap = new Map<string, number>()
    queryResponse.matches.forEach((match) => {
      const docId = match.metadata?.documentId as string
      if (docId) {
        vectorCountMap.set(docId, (vectorCountMap.get(docId) || 0) + 1)
      }
    })

    // Enrich documents with vector info
    const documentsWithVectors = approvedDocs.map((doc) => ({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy,
      wordCount: doc.metadata.wordCount,
      vectorCount: vectorCountMap.get(doc.id) || 0,
      pineconeIds: doc.pineconeIds || [],
      expectedVectors: doc.chunks?.length || 0,
      status: vectorCountMap.get(doc.id) === doc.chunks?.length ? 'synced' : 'out-of-sync',
    }))

    return NextResponse.json({
      success: true,
      documents: documentsWithVectors,
      totalDocuments: documentsWithVectors.length,
      totalVectors: Array.from(vectorCountMap.values()).reduce((a, b) => a + b, 0),
    })
  } catch (error: any) {
    console.error('Failed to get document vectors:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get document vectors' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/vectors/documents
 * Delete vectors for selected documents
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentIds } = await req.json()

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid documentIds parameter' },
        { status: 400 }
      )
    }

    const index = await getPineconeIndex()

    // Get all document vectors
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0),
      topK: 10000,
      filter: { vectorType: 'document' },
      includeMetadata: true,
      includeValues: false,
    })

    // Filter vectors belonging to selected documents
    const vectorIdsToDelete = queryResponse.matches
      .filter((match) => documentIds.includes(match.metadata?.documentId as string))
      .map((match) => match.id)

    if (vectorIdsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No vectors found for selected documents',
      })
    }

    // Delete in batches of 100
    const BATCH_SIZE = 100
    for (let i = 0; i < vectorIdsToDelete.length; i += BATCH_SIZE) {
      const batch = vectorIdsToDelete.slice(i, i + BATCH_SIZE)
      await index.deleteMany(batch)
    }

    console.log(`[Vectors] Deleted ${vectorIdsToDelete.length} vectors from documents:`, documentIds)

    return NextResponse.json({
      success: true,
      deleted: vectorIdsToDelete.length,
      documentIds,
    })
  } catch (error: any) {
    console.error('Failed to delete document vectors:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete document vectors' },
      { status: 500 }
    )
  }
}
