import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex } from '@/lib/pinecone'

export const runtime = 'nodejs'

/**
 * GET /api/admin/vectors?type=website|document|video
 * List all vectors of a specific type
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') // website, document, video

    if (!type || !['website', 'document', 'video'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: website, document, or video' },
        { status: 400 }
      )
    }

    const index = await getPineconeIndex()

    // Query vectors with metadata filtering
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector
      topK: 10000,
      includeMetadata: true,
      filter: {
        vectorType: { $eq: type },
      },
    })

    // Format the response
    const vectors = queryResponse.matches?.map((match) => ({
      id: match.id,
      score: match.score,
      metadata: match.metadata,
    }))

    return NextResponse.json({
      success: true,
      type,
      count: vectors?.length || 0,
      vectors: vectors || [],
    })
  } catch (error: any) {
    console.error('List vectors error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list vectors' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/vectors?type=website|document|video|all&id=vector_id
 * Delete vectors by type or specific ID
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type') // website, document, video, all
    const vectorId = searchParams.get('id') // specific vector ID

    const index = await getPineconeIndex()

    // Delete specific vector by ID
    if (vectorId) {
      await index.deleteOne(vectorId)
      console.log(`[VectorDelete] Deleted vector: ${vectorId}`)
      return NextResponse.json({
        success: true,
        message: `Deleted vector: ${vectorId}`,
      })
    }

    // Delete all vectors (nuclear option)
    if (type === 'all') {
      await index.deleteAll()
      console.log('[VectorDelete] Deleted ALL vectors from Pinecone')
      return NextResponse.json({
        success: true,
        message: 'Deleted all vectors from Pinecone',
      })
    }

    // Delete vectors by type
    if (!type || !['website', 'document', 'video'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: website, document, video, or all' },
        { status: 400 }
      )
    }

    // First, query to get all vector IDs of this type
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0),
      topK: 10000,
      includeMetadata: true,
      filter: {
        vectorType: { $eq: type },
      },
    })

    const vectorIds = queryResponse.matches?.map((match) => match.id) || []

    if (vectorIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No vectors found for type: ${type}`,
        count: 0,
      })
    }

    // Delete vectors in batches (Pinecone has limits)
    const batchSize = 1000
    let deletedCount = 0

    for (let i = 0; i < vectorIds.length; i += batchSize) {
      const batch = vectorIds.slice(i, i + batchSize)
      await index.deleteMany(batch)
      deletedCount += batch.length
    }

    console.log(`[VectorDelete] Deleted ${deletedCount} vectors of type: ${type}`)

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} vectors of type: ${type}`,
      count: deletedCount,
    })
  } catch (error: any) {
    console.error('Delete vectors error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete vectors' },
      { status: 500 }
    )
  }
}
