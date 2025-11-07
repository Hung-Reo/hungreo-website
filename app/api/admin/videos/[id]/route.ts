import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getVideo, updateVideoCategory, deleteVideo, type VideoCategory } from '@/lib/videoManager'
import { getPineconeIndex } from '@/lib/pinecone'
import { createEmbedding } from '@/lib/openai'
import { chunkText } from '@/lib/documentProcessor'

export const runtime = 'nodejs'

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
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { category, generateEmbeddings } = await req.json()

    const video = await getVideo(params.id)
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Update category if provided
    if (category) {
      await updateVideoCategory(params.id, category as VideoCategory)
    }

    // Generate embeddings if requested
    if (generateEmbeddings) {
      const index = await getPineconeIndex()
      const pineconeIds: string[] = []

      // Combine title, description, and transcript
      const content = `${video.title}\n${video.description}\n${video.transcript || ''}`

      // Chunk the content
      const chunks = chunkText(content, 512)

      // Generate embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await createEmbedding(chunk)

        const vectorId = `video_${video.videoId}_chunk_${i}`
        await index.upsert([
          {
            id: vectorId,
            values: embedding,
            metadata: {
              title: video.title,
              description: chunk.substring(0, 500),
              type: 'video',
              category: video.category,
              videoId: video.videoId,
              channelTitle: video.channelTitle,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
          },
        ])

        pineconeIds.push(vectorId)
      }

      // Update video with Pinecone IDs
      video.pineconeIds = pineconeIds
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update video error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update video' }, { status: 500 })
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

    // Remove from Pinecone if exists
    if (video.pineconeIds && video.pineconeIds.length > 0) {
      const index = await getPineconeIndex()
      await index.deleteMany(video.pineconeIds)
    }

    await deleteVideo(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete video error:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}
