import { randomUUID } from 'crypto'
import { chunkText } from './documentProcessor'
import { createEmbedding } from './openai'
import { getPineconeIndex, listVideoVectorIds } from './pinecone'
import {
  replaceVectorSet,
  validateTranscript,
  type ReplaceVectorSetResult,
} from './videoVectorLifecycle'
import type { Video } from './videoManager'

interface ReplaceVideoEmbeddingsOptions {
  video: Video
  transcript?: string
  saveVideoRecord: (video: Video) => Promise<void>
  onProgress?: (completed: number, total: number) => Promise<void> | void
  onCleanupError?: (error: unknown, ids: string[]) => Promise<void> | void
}

export interface ReplaceVideoEmbeddingsResult extends ReplaceVectorSetResult {
  video: Video
  chunks: number
  transcriptWords: number
}

export function prepareVideoEmbeddingContent(
  video: Video,
  transcriptOverride?: string
): { transcript: string; transcriptWords: number; chunks: string[] } {
  const validated = validateTranscript(
    transcriptOverride ?? video.en.transcript ?? ''
  )
  const content = `${video.en.title}\n${video.en.description}\n${validated.transcript}`
  const chunks = chunkText(content, 500, 100)

  if (chunks.length > 300) {
    throw new Error('Video exceeds the safety limit of 300 embedding chunks')
  }

  return {
    transcript: validated.transcript,
    transcriptWords: validated.words,
    chunks,
  }
}

/**
 * Stage a complete versioned vector set, switch KV to it, then retire every
 * previously known vector for the same video.
 */
export async function replaceVideoEmbeddings(
  options: ReplaceVideoEmbeddingsOptions
): Promise<ReplaceVideoEmbeddingsResult> {
  const prepared = prepareVideoEmbeddingContent(
    options.video,
    options.transcript
  )
  const index = await getPineconeIndex()
  const previousIds = await listVideoVectorIds(
    options.video.videoId,
    options.video.pineconeIds || []
  )
  const generation = `${Date.now()}_${randomUUID().slice(0, 8)}`
  let updatedVideo: Video | null = null

  const lifecycle = await replaceVectorSet({
    chunks: prepared.chunks,
    previousIds,
    makeVectorId: (chunkIndex) =>
      `video_${options.video.videoId}_v${generation}_chunk_${chunkIndex}`,
    upsertChunk: async ({ id, chunk, index: chunkIndex, totalChunks }) => {
      const embedding = await createEmbedding(chunk)
      await index.upsert([
        {
          id,
          values: embedding,
          metadata: {
            title: options.video.en.title,
            content: chunk,
            description: chunk,
            type: 'video',
            vectorType: 'video',
            category: options.video.category,
            videoId: options.video.videoId,
            channelTitle: options.video.channelTitle,
            chunkIndex,
            totalChunks,
            generation,
          },
        },
      ])
    },
    saveVectorIds: async (pineconeIds) => {
      updatedVideo = {
        ...options.video,
        en: {
          ...options.video.en,
          transcript: prepared.transcript,
        },
        transcriptStatus: 'ready',
        transcriptErrorCode: undefined,
        pineconeIds,
      }
      await options.saveVideoRecord(updatedVideo)
    },
    verifySavedVectorIds: async (pineconeIds) => {
      const { getVideo } = await import('./videoManager')
      const persisted = await getVideo(options.video.id)
      return (
        persisted?.pineconeIds?.length === pineconeIds.length &&
        persisted.pineconeIds.every((id, index) => id === pineconeIds[index])
      )
    },
    deleteVectors: async (ids) => {
      for (let i = 0; i < ids.length; i += 1000) {
        await index.deleteMany(ids.slice(i, i + 1000))
      }
    },
    onProgress: options.onProgress,
    onCleanupError: options.onCleanupError,
  })

  if (!updatedVideo) {
    throw new Error('Failed to persist the replacement video vector set')
  }

  return {
    ...lifecycle,
    video: updatedVideo,
    chunks: prepared.chunks.length,
    transcriptWords: prepared.transcriptWords,
  }
}
