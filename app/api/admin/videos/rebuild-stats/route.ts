import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { kv } from '@vercel/kv'
import { getAllVideosComplete } from '@/lib/videoManager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Rebuild Redis category sets from actual video data
 * This fixes inconsistencies where stats don't match actual video counts
 */
export async function POST() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[RebuildStats] Starting category sets rebuild...')

    // Get all videos from KV (paginated so we never drop videos beyond the
    // first page before deleting the category sets)
    const allVideos = await getAllVideosComplete()
    console.log(`[RebuildStats] Found ${allVideos.length} total videos`)

    // Clear existing category sets
    const categories = ['Leadership', 'AI Works', 'Health', 'Entertaining', 'Human Philosophy']
    for (const category of categories) {
      const setKey = `videos:${category}`
      // Get all members before deleting
      const existingMembers = await kv.smembers(setKey)
      if (existingMembers && existingMembers.length > 0) {
        await kv.del(setKey)
        console.log(`[RebuildStats] Cleared ${setKey} (had ${existingMembers.length} members)`)
      }
    }

    // Rebuild category sets
    const categoryStats: Record<string, number> = {}
    for (const video of allVideos) {
      const setKey = `videos:${video.category}`
      await kv.sadd(setKey, video.id)
      categoryStats[video.category] = (categoryStats[video.category] || 0) + 1
    }

    console.log('[RebuildStats] Category stats:', categoryStats)

    // Rebuild videos:all sorted set
    await kv.del('videos:all')
    for (const video of allVideos) {
      await kv.zadd('videos:all', { score: video.addedAt, member: video.id })
    }
    console.log(`[RebuildStats] Rebuilt videos:all with ${allVideos.length} videos`)

    return NextResponse.json({
      success: true,
      message: 'Category sets rebuilt successfully',
      stats: {
        totalVideos: allVideos.length,
        categories: categoryStats,
      },
    })
  } catch (error: any) {
    console.error('[RebuildStats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to rebuild stats', details: error.message },
      { status: 500 }
    )
  }
}
