import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex, listAllVectorIds } from '@/lib/pinecone'
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

    // Get all document vector IDs using proper pagination (no topK limit)
    console.log('[Vectors] Listing all document vectors...')
    const documentVectorIds = await listAllVectorIds({ vectorType: 'document' })
    console.log(`[Vectors] Found ${documentVectorIds.length} document vectors`)

    // Fetch metadata for all vectors in batches
    const FETCH_BATCH_SIZE = 1000
    const allVectors: Array<{ id: string; metadata: Record<string, any> }> = []

    for (let i = 0; i < documentVectorIds.length; i += FETCH_BATCH_SIZE) {
      const batch = documentVectorIds.slice(i, i + FETCH_BATCH_SIZE)
      const fetchResponse = await index.fetch(batch)

      for (const [id, vector] of Object.entries(fetchResponse.records)) {
        allVectors.push({
          id,
          metadata: vector.metadata || {},
        })
      }
    }

    // If requesting detailed view for a specific document
    if (detailedDocId) {
      const docVectors = allVectors
        .filter((vector) => vector.metadata?.documentId === detailedDocId)
        .map((vector) => ({
          id: vector.id,
          content: vector.metadata?.content || vector.metadata?.description || '', // Try 'content' first (documents), fallback to 'description' (old format)
          chunkIndex: (vector.metadata?.chunkIndex as number) || 0,
          fileName: vector.metadata?.fileName || '',
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
    allVectors.forEach((vector) => {
      const docId = vector.metadata?.documentId as string
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

    // Get all document vector IDs using proper pagination
    console.log('[Vectors] Listing all document vectors for deletion...')
    const documentVectorIds = await listAllVectorIds({ vectorType: 'document' })
    console.log(`[Vectors] Found ${documentVectorIds.length} document vectors`)

    // Fetch metadata to filter by documentId
    const FETCH_BATCH_SIZE = 1000
    const vectorIdsToDelete: string[] = []

    for (let i = 0; i < documentVectorIds.length; i += FETCH_BATCH_SIZE) {
      const batch = documentVectorIds.slice(i, i + FETCH_BATCH_SIZE)
      const fetchResponse = await index.fetch(batch)

      for (const [id, vector] of Object.entries(fetchResponse.records)) {
        const docId = vector.metadata?.documentId as string
        if (documentIds.includes(docId)) {
          vectorIdsToDelete.push(id)
        }
      }
    }

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
