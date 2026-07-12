import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getVideo,
  saveVideo,
  updateVideoCategory,
  deleteVideo,
  getVideoTranscriptResult,
  transcriptStatusFromFailure,
  type VideoCategory,
} from '@/lib/videoManager'
import {
  prepareVideoEmbeddingContent,
  replaceVideoEmbeddings,
} from '@/lib/videoEmbeddingManager'
import { createJob, emitProgress, appendLog, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large videos
const VIDEO_CATEGORIES: VideoCategory[] = [
  'Leadership',
  'AI Works',
  'Health',
  'Entertaining',
  'Human Philosophy',
]

/**
 * OPTIONS - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// GET single video
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await getVideo(params.id)

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, video })
  } catch (error: any) {
    console.error('Get video error:', error)
    return NextResponse.json({ error: 'Failed to get video' }, { status: 500 })
  }
}

// PATCH update video category or generate embeddings
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let jobId: string | null = null
  let isGeneratingEmbeddings = false

  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, generateEmbeddings, refetchTranscript } = await req.json()
    if (
      (category !== undefined && !VIDEO_CATEGORIES.includes(category)) ||
      (generateEmbeddings !== undefined &&
        typeof generateEmbeddings !== 'boolean') ||
      (refetchTranscript !== undefined && typeof refetchTranscript !== 'boolean')
    ) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 })
    }
    isGeneratingEmbeddings = generateEmbeddings

    const video = await getVideo(params.id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update category if provided
    if (category) {
      await updateVideoCategory(params.id, category as VideoCategory)
      video.category = category as VideoCategory
    }

    // Re-fetch transcript from YouTube if requested
    if (refetchTranscript) {
      const transcriptResult = await getVideoTranscriptResult(video.videoId)

      if (!transcriptResult.ok) {
        video.transcriptStatus = transcriptStatusFromFailure(
          transcriptResult.code
        )
        video.transcriptErrorCode = transcriptResult.code
        await saveVideo(video)
        return NextResponse.json(
          {
            error: transcriptResult.message,
            code: transcriptResult.code,
            retryable: transcriptResult.retryable,
          },
          { status: 502 }
        )
      }
      const transcript = transcriptResult.transcript

      console.log(
        `[Video] Re-fetched transcript for ${video.videoId}: ${transcript.split(/\s+/).length} words`
      )

      // If embeddings are not also requested, return the updated video now
      if (!generateEmbeddings) {
        video.en.transcript = transcript
        video.transcriptStatus = 'ready'
        video.transcriptErrorCode = undefined
        await saveVideo(video)
        return NextResponse.json({
          success: true,
          video,
          transcriptWords: transcript.split(/\s+/).length,
        })
      }

      // Keep the fetched transcript in memory. replaceVideoEmbeddings() will
      // persist it only after the complete staged vector set exists.
      video.en.transcript = transcript
    }

    // Generate embeddings if requested
    if (generateEmbeddings) {
      const prepared = prepareVideoEmbeddingContent(video)
      console.log(`[Video Embedding] Creating ${prepared.chunks.length} chunks for video ${video.videoId}`)

      // Create job tracker
      jobId = `video-embed-${Date.now()}`
      await createJob(jobId, 'video-embedding', prepared.chunks.length)
      await appendLog(jobId, 'info', `Starting embedding for ${video.en.title}`)
      await emitProgress(jobId, `Processing ${video.en.title}...`, 0, prepared.chunks.length)

      const replacement = await replaceVideoEmbeddings({
        video,
        saveVideoRecord: saveVideo,
        onProgress: async (completed, total) => {
          await emitProgress(
            jobId!,
            `Creating vector ${completed}/${total} for ${video.en.title}`,
            completed,
            total
          )
        },
        onCleanupError: async (_error, ids) => {
          await appendLog(
            jobId!,
            'warn',
            `Failed to clean up ${ids.length} stale vectors; run vector audit`
          )
        },
      })

      await appendLog(jobId, 'info', `Created ${replacement.vectorIds.length} vectors successfully`)
      await completeJob(jobId, {
        videoId: video.videoId,
        title: video.en.title,
        vectorsCreated: replacement.vectorIds.length,
        chunks: replacement.chunks,
        staleVectorsDeleted: replacement.cleanupSucceeded
          ? replacement.staleIds.length
          : 0,
      })

      return NextResponse.json({
        success: true,
        jobId,
        video: replacement.video,
        vectorsCreated: replacement.vectorIds.length,
        staleVectorsDeleted: replacement.cleanupSucceeded
          ? replacement.staleIds.length
          : 0,
        cleanupWarning: replacement.cleanupSucceeded
          ? undefined
          : 'New vectors are active, but some stale vectors could not be deleted.',
      })
    }

    // If only category was updated, also save
    if (category && !generateEmbeddings) {
      const updatedVideo = await getVideo(params.id)
      if (updatedVideo) {
        return NextResponse.json({ success: true, video: updatedVideo })
      }
    }

    return NextResponse.json({ success: true, video })
  } catch (error: any) {
    console.error('Update video error:', error)
    if (isGeneratingEmbeddings && jobId) {
      await failJob(jobId, error.message || 'Failed to generate embeddings')
    }
    return NextResponse.json({ error: error.message || 'Failed to update video' }, { status: 500 })
  }
}

// PUT update video content (bilingual)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate English content (required)
    if (!body.en?.title || !body.en?.description) {
      return NextResponse.json(
        { error: 'English title and description are required' },
        { status: 400 }
      )
    }

    // Get existing video to preserve metadata
    const existingVideo = await getVideo(params.id)
    if (!existingVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update video with new content
    const updatedVideo = {
      ...existingVideo,
      ...body,
      // Preserve system metadata
      id: existingVideo.id,
      videoId: existingVideo.videoId,
      addedAt: existingVideo.addedAt,
      addedBy: existingVideo.addedBy,
      // Update translation status if Vietnamese content provided
      translationStatus: body.translationStatus || existingVideo.translationStatus,
    }

    await saveVideo(updatedVideo)

    return NextResponse.json({ success: true, video: updatedVideo })
  } catch (error: any) {
    console.error('Update video content error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    )
  }
}

// DELETE video
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const video = await getVideo(params.id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const { deletedVectorIds } = await deleteVideo(params.id)

    return NextResponse.json({
      success: true,
      vectorsDeletionRequested: deletedVectorIds.length,
    })
  } catch (error: any) {
    console.error('Delete video error:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
