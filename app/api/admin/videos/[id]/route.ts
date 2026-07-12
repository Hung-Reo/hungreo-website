import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVideo, saveVideo, updateVideoCategory, deleteVideo, getVideoTranscript, type VideoCategory } from '@/lib/videoManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/documentProcessor'
import { createJob, emitProgress, appendLog, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large videos

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
    isGeneratingEmbeddings = generateEmbeddings

    const video = await getVideo(params.id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update category if provided
    if (category) {
      await updateVideoCategory(params.id, category as VideoCategory)
    }

    // Re-fetch transcript from YouTube if requested
    if (refetchTranscript) {
      const transcript = await getVideoTranscript(video.videoId)

      if (!transcript) {
        return NextResponse.json(
          {
            error:
              'Could not fetch transcript from YouTube. The video may have no captions, or YouTube blocked the request.',
          },
          { status: 502 }
        )
      }

      video.en.transcript = transcript
      await saveVideo(video)
      console.log(
        `[Video] Re-fetched transcript for ${video.videoId}: ${transcript.split(/\s+/).length} words`
      )

      // If embeddings are not also requested, return the updated video now
      if (!generateEmbeddings) {
        return NextResponse.json({
          success: true,
          video,
          transcriptWords: transcript.split(/\s+/).length,
        })
      }
    }

    // Generate embeddings if requested
    if (generateEmbeddings) {
      // Combine title, description, and transcript (use English content)
      const content = `${video.en.title}\n${video.en.description}\n${video.en.transcript || ''}`

      // Chunk the content - use larger chunks for videos (transcripts are long)
      const chunks = chunkText(content, 500, 100) // 500 words, 100 overlap for videos

      console.log(`[Video Embedding] Creating ${chunks.length} chunks for video ${video.videoId}`)

      // Create job tracker
      jobId = `video-embed-${Date.now()}`
      await createJob(jobId, 'video-embedding', chunks.length)
      await appendLog(jobId, 'info', `Starting embedding for ${video.en.title}`)
      await emitProgress(jobId, `Processing ${video.en.title}...`, 0, chunks.length)

      const index = await getPineconeIndex()
      const pineconeIds: string[] = []

      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]

        try {
          await emitProgress(
            jobId,
            `Creating vector ${i + 1}/${chunks.length} for ${video.en.title}`,
            i + 1,
            chunks.length
          )

          const embedding = await createEmbedding(chunk)
          const vectorId = `video_${video.videoId}_chunk_${i}`

          await index.upsert([
            {
              id: vectorId,
              values: embedding,
              metadata: {
                title: video.en.title,
                content: chunk, // Store FULL chunk content (primary field)
                description: chunk, // Keep for backward compatibility
                type: 'video',
                vectorType: 'video', // For filtering in Vector Manager
                category: video.category,
                videoId: video.videoId,
                channelTitle: video.channelTitle,
                chunkIndex: i,
                totalChunks: chunks.length,
              },
            },
          ])

          pineconeIds.push(vectorId)
        } catch (error) {
          console.error(`[Video Embedding] Failed to create vector ${i}:`, error)
          await appendLog(jobId, 'error', `Failed to create vector ${i + 1}`)
        }
      }

      // Update video with Pinecone IDs and save to KV
      video.pineconeIds = pineconeIds
      await saveVideo(video)

      await appendLog(jobId, 'info', `Created ${pineconeIds.length} vectors successfully`)
      await completeJob(jobId, {
        videoId: video.videoId,
        title: video.en.title,
        vectorsCreated: pineconeIds.length,
        chunks: chunks.length,
      })

      return NextResponse.json({
        success: true,
        jobId,
        video,
        vectorsCreated: pineconeIds.length,
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

    const index = await getPineconeIndex()

    // Strategy 1: Delete using saved pineconeIds (for newer videos)
    if (video.pineconeIds && video.pineconeIds.length > 0) {
      await index.deleteMany(video.pineconeIds)
      console.log(`[Delete] Removed ${video.pineconeIds.length} vectors using pineconeIds`)
    } else {
      // Strategy 2: Query and delete by videoId (for older videos without pineconeIds)
      // Query to find all vectors with this videoId
      const { dimension: vidDimension = 3072 } = await index.describeIndexStats()
      const queryResponse = await index.query({
        vector: new Array(vidDimension).fill(0), // Dummy vector sized to actual index dims
        topK: 10000,
        includeMetadata: true,
        filter: {
          videoId: { $eq: video.videoId },
        },
      })

      const vectorIds = queryResponse.matches?.map((match) => match.id) || []

      if (vectorIds.length > 0) {
        await index.deleteMany(vectorIds)
        console.log(`[Delete] Removed ${vectorIds.length} vectors by querying videoId: ${video.videoId}`)
      } else {
        console.log(`[Delete] No vectors found for videoId: ${video.videoId}`)
      }
    }

    // Delete from Redis
    await deleteVideo(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete video error:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
