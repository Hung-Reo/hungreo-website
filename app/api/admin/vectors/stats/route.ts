import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex } from '@/lib/pinecone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/vectors/stats
 * Get statistics about vectors in Pinecone by type
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const index = await getPineconeIndex()

    // Query all vectors with metadata to categorize them
    // Note: Pinecone has a limit on query results, so we'll use describeIndexStats
    const stats = await index.describeIndexStats()

    // Use actual index dimension (not hardcoded) to support any embedding model
    const dimension = stats.dimension ?? 3072

    // Query a sample of vectors to analyze metadata
    const sampleQuery = await index.query({
      vector: new Array(dimension).fill(0), // Dummy vector sized to actual index dims
      topK: 10000, // Get as many as possible
      includeMetadata: true,
    })

    // Categorize vectors by type
    const typeStats = {
      website: 0,
      document: 0,
      video: 0,
      unknown: 0,
      total: stats.totalRecordCount || 0,
    }

    // Count by vectorType metadata
    sampleQuery.matches?.forEach((match) => {
      const vectorType = (match.metadata?.vectorType as string) || (match.metadata?.type as string)

      if (vectorType === 'website') {
        typeStats.website++
      } else if (vectorType === 'document') {
        typeStats.document++
      } else if (vectorType === 'video') {
        typeStats.video++
      } else {
        typeStats.unknown++
      }
    })

    return NextResponse.json({
      success: true,
      stats: typeStats,
      details: {
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
      },
    })
  } catch (error: any) {
    console.error('Get vector stats error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get vector statistics' },
      { status: 500 }
    )
  }
}
