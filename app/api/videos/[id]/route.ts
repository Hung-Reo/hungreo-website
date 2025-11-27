import { NextRequest, NextResponse } from 'next/server'
import { getVideo, normalizeVideo } from '@/lib/videoManager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Public endpoint to get a single video by ID
 * This is more efficient than fetching all videos and filtering
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }

    const video = await getVideo(videoId)

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Normalize to bilingual format
    const normalizedVideo = normalizeVideo(video)

    // Remove only truly sensitive fields (addedBy, etc.)
    // Transcript is public as it's used in the chatbot
    const publicVideo = {
      id: normalizedVideo.id,
      videoId: normalizedVideo.videoId,
      en: normalizedVideo.en,  // Includes transcript
      vi: normalizedVideo.vi,  // Includes transcript
      title: normalizedVideo.title,
      description: normalizedVideo.description,
      channelTitle: normalizedVideo.channelTitle,
      publishedAt: normalizedVideo.publishedAt,
      thumbnailUrl: normalizedVideo.thumbnailUrl,
      duration: normalizedVideo.duration,
      category: normalizedVideo.category,
    }

    return NextResponse.json({
      success: true,
      video: publicVideo,
    })
  } catch (error: any) {
    console.error('Get video by ID error:', error)
    return NextResponse.json({ error: 'Failed to get video' }, { status: 500 })
  }
}
