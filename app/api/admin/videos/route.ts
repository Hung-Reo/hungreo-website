import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllVideos, getVideosByCategory, getVideoStats, type VideoCategory } from '@/lib/videoManager'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') as VideoCategory | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let videos
    if (category) {
      videos = await getVideosByCategory(category)
    } else {
      videos = await getAllVideos(limit, offset)
    }

    const stats = await getVideoStats()

    return NextResponse.json({
      success: true,
      videos,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    })
  } catch (error: any) {
    console.error('Videos list error:', error)
    return NextResponse.json({ error: 'Failed to get videos' }, { status: 500 })
  }
}
