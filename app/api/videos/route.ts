import { NextRequest, NextResponse } from 'next/server'
import { getAllVideos, getVideosByCategory, getVideoStats, type VideoCategory } from '@/lib/videoManager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public endpoint to get videos (no authentication required)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') as VideoCategory | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const statsOnly = searchParams.get('stats') === 'true'

    const stats = await getVideoStats()

    // If only stats requested, return early
    if (statsOnly) {
      return NextResponse.json({
        success: true,
        ...stats,
      })
    }

    let videos
    if (category) {
      videos = await getVideosByCategory(category)
    } else {
      videos = await getAllVideos(limit, offset)
    }

    // Remove sensitive fields (keep bilingual structure + legacy fallbacks)
    const publicVideos = videos.map((v) => ({
      id: v.id,
      videoId: v.videoId,
      // Bilingual content
      en: v.en,
      vi: v.vi,
      // Legacy fields for backward compatibility
      title: v.title,
      description: v.description,
      // Metadata
      channelTitle: v.channelTitle,
      publishedAt: v.publishedAt,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      category: v.category,
    }))

    return NextResponse.json({
      success: true,
      videos: publicVideos,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    })
  } catch (error: any) {
    console.error('Public videos list error:', error)
    return NextResponse.json({ error: 'Failed to get videos' }, { status: 500 })
  }
}
