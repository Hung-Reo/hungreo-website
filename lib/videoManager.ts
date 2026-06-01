/**
 * YouTube Video Management with Vercel KV
 * Handles categorized video library with transcripts
 * Updated: Bilingual support (EN/VI)
 */

import { kv } from '@vercel/kv'
import { Innertube } from 'youtubei.js'
import axios from 'axios'

export type VideoCategory = 'Leadership' | 'AI Works' | 'Health' | 'Entertaining' | 'Human Philosophy'

/**
 * Language-specific video content
 */
export interface VideoContent {
  title: string
  description: string
  transcript?: string
  summary?: string
}

/**
 * Translation metadata
 */
export interface TranslationStatus {
  viTranslated: boolean
  translatedAt?: number
  translatedBy?: string
  translationMethod?: 'manual' | 'auto' | 'hybrid'
}

/**
 * Video interface with bilingual support
 */
export interface Video {
  id: string
  videoId: string

  // Language-agnostic metadata
  channelTitle: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory

  // Bilingual content
  en: VideoContent
  vi: VideoContent

  // Metadata
  addedAt: number
  addedBy: string
  pineconeIds?: string[]
  translationStatus?: TranslationStatus

  // Legacy fields (for backward compatibility during migration)
  title?: string
  description?: string
  transcript?: string
  summary?: string
}

/**
 * Normalize video to bilingual format
 * Handles backward compatibility for legacy videos
 */
export function normalizeVideo(video: any): Video {
  // If already in new format, return as-is
  if (video.en && video.vi) {
    return video as Video
  }

  // Convert legacy format to new format
  return {
    ...video,
    en: {
      title: video.title || video.en?.title || '',
      description: video.description || video.en?.description || '',
      transcript: video.transcript || video.en?.transcript,
      summary: video.summary || video.en?.summary,
    },
    vi: video.vi || {
      title: '',
      description: '',
      transcript: undefined,
      summary: undefined,
    },
    translationStatus: video.translationStatus || {
      viTranslated: false,
    },
  }
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Get video metadata from YouTube Data API
 */
export async function getVideoMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error('YouTube API key not configured')
  }

  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
  )

  const video = response.data.items?.[0]

  if (!video) {
    throw new Error('Video not found')
  }

  return {
    videoId,
    title: video.snippet.title,
    channelTitle: video.snippet.channelTitle,
    description: video.snippet.description,
    publishedAt: video.snippet.publishedAt,
    thumbnailUrl: video.snippet.thumbnails.medium.url,
    duration: video.contentDetails.duration,
  }
}

/**
 * Get video transcript using youtubei.js
 */
export async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    const youtube = await Innertube.create()
    const info = await youtube.getInfo(videoId)

    // Try to get transcript
    const transcriptData = await info.getTranscript()

    if (transcriptData?.transcript?.content?.body?.initial_segments) {
      const segments = transcriptData.transcript.content.body.initial_segments
      const fullText = segments.map((seg: any) => seg.snippet.text).join(' ')
      console.log(`[VideoManager] Fetched transcript for ${videoId}: ${segments.length} segments, ${fullText.split(/\s+/).length} words`)
      return fullText
    }

    console.log(`[VideoManager] No transcript available for ${videoId}`)
    return ''
  } catch (error: any) {
    console.error(`[VideoManager] Failed to get transcript for ${videoId}:`, error.message)
    return ''
  }
}

/**
 * Save video to Vercel KV
 */
export async function saveVideo(video: Video): Promise<void> {
  try {
    const key = `video:${video.id}`
    await kv.set(key, video)

    // Add to category list
    await kv.sadd(`videos:${video.category}`, video.id)

    // Add to all videos sorted set (by added date)
    await kv.zadd('videos:all', { score: video.addedAt, member: video.id })
  } catch (error) {
    console.error('Failed to save video:', error)
    throw new Error('Failed to save video')
  }
}

/**
 * Get video by ID
 */
export async function getVideo(videoId: string): Promise<Video | null> {
  try {
    const video = await kv.get<any>(`video:${videoId}`)
    if (!video) return null

    // Normalize to ensure bilingual format
    return normalizeVideo(video)
  } catch (error) {
    console.error('Failed to get video:', error)
    return null
  }
}

/**
 * Get videos by category
 */
export async function getVideosByCategory(category: VideoCategory): Promise<Video[]> {
  try {
    const videoIds = await kv.smembers(`videos:${category}`)
    const videos: Video[] = []

    for (const id of videoIds) {
      const video = await getVideo(id as string)
      if (video) {
        videos.push(video)
      }
    }

    // Sort by added date (newest first)
    return videos.sort((a, b) => b.addedAt - a.addedAt)
  } catch (error) {
    console.error('Failed to get videos by category:', error)
    return []
  }
}

/**
 * Get all videos (paginated)
 */
export async function getAllVideos(limit: number = 50, offset: number = 0): Promise<Video[]> {
  try {
    const videoIds = await kv.zrange('videos:all', offset, offset + limit - 1, { rev: true })
    const videos: Video[] = []

    for (const id of videoIds) {
      const video = await getVideo(id as string)
      if (video) {
        videos.push(video)
      }
    }

    return videos
  } catch (error) {
    console.error('Failed to get all videos:', error)
    return []
  }
}

/**
 * Update video category with atomic-like operations
 */
export async function updateVideoCategory(videoId: string, newCategory: VideoCategory): Promise<void> {
  const video = await getVideo(videoId)
  if (!video) {
    throw new Error('Video not found')
  }

  const oldCategory = video.category

  // No change needed
  if (oldCategory === newCategory) {
    console.log(`[VideoManager] Video ${videoId} already in category ${newCategory}`)
    return
  }

  console.log(`[VideoManager] Moving video ${videoId} from ${oldCategory} to ${newCategory}`)

  // Step 1: Update video object
  const updatedVideo = { ...video, category: newCategory }
  await kv.set(`video:${videoId}`, updatedVideo)

  // Step 2: Update category sets with Promise.allSettled
  const categoryOperations = [
    kv.srem(`videos:${oldCategory}`, videoId),
    kv.sadd(`videos:${newCategory}`, videoId),
  ]

  const results = await Promise.allSettled(categoryOperations)
  const failures = results.filter(r => r.status === 'rejected')

  if (failures.length > 0) {
    console.error('[VideoManager] Partial category update failure:', failures)

    // Rollback video object update
    try {
      await kv.set(`video:${videoId}`, video)
      console.log('[VideoManager] Rolled back video object update')
    } catch (rollbackError) {
      console.error('[VideoManager] Failed to rollback video update:', rollbackError)
    }

    throw new Error(`Failed to update category sets. ${failures.length}/2 operations failed. Changes rolled back. Run rebuild stats to fix any inconsistencies.`)
  }

  console.log(`[VideoManager] Successfully moved video ${videoId} to ${newCategory}`)
}

/**
 * Delete Pinecone vectors for a video
 * Non-blocking - will not throw errors to prevent blocking video deletion
 */
async function deletePineconeVectors(pineconeIds?: string[]): Promise<void> {
  if (!pineconeIds || pineconeIds.length === 0) {
    console.log('[VideoManager] No Pinecone vectors to delete')
    return
  }

  try {
    const { getPineconeIndex } = await import('./pinecone')
    const index = await getPineconeIndex()

    await index.deleteMany(pineconeIds)
    console.log(`[VideoManager] Deleted ${pineconeIds.length} vectors from Pinecone`)
  } catch (error) {
    // Log error but don't throw - allow video deletion to proceed
    console.error('[VideoManager] Failed to delete Pinecone vectors:', error)
    console.error('[VideoManager] Orphaned vector IDs:', pineconeIds)
  }
}

/**
 * Delete video with atomic-like operations and cleanup
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const video = await getVideo(videoId)
  if (!video) {
    throw new Error('Video not found')
  }

  console.log(`[VideoManager] Deleting video ${videoId} from category ${video.category}`)

  // Step 1: Delete from Pinecone first (non-blocking)
  await deletePineconeVectors(video.pineconeIds)

  // Step 2: Delete from KV with Promise.allSettled to track failures
  const kvOperations = [
    kv.del(`video:${videoId}`),
    kv.srem(`videos:${video.category}`, videoId),
    kv.zrem('videos:all', videoId),
  ]

  const results = await Promise.allSettled(kvOperations)

  // Check for failures
  const failures = results.filter(r => r.status === 'rejected')

  if (failures.length > 0) {
    console.error('[VideoManager] Partial delete failure:', failures)

    // Log which operations failed
    const operationNames = ['video key', 'category set', 'all videos set']
    failures.forEach((failure, index) => {
      if (failure.status === 'rejected') {
        console.error(`[VideoManager] Failed to delete from ${operationNames[index]}:`, failure.reason)
      }
    })

    throw new Error(`Failed to delete video completely. ${failures.length}/${kvOperations.length} operations failed. Database may be inconsistent - run rebuild stats to fix.`)
  }

  console.log(`[VideoManager] Successfully deleted video ${videoId}`)
}

/**
 * Get every video by paginating through videos:all until exhausted.
 * Used before destructive index rebuilds so videos beyond the first page
 * are never dropped from the indexes.
 */
export async function getAllVideosComplete(): Promise<Video[]> {
  const PAGE_SIZE = 500
  const all: Video[] = []
  let offset = 0

  // Paginate on the raw ID count from the zset, NOT the loaded video count.
  // getAllVideos drops IDs whose video:<id> record is missing, so a single
  // corrupt record would shorten a page and stop the loop early, silently
  // dropping every video after that offset. Reading IDs directly avoids that.
  while (true) {
    const ids = await kv.zrange('videos:all', offset, offset + PAGE_SIZE - 1, { rev: true })
    if (!ids || ids.length === 0) break

    for (const id of ids) {
      const video = await getVideo(id as string)
      if (video) all.push(video)
    }

    if (ids.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  return all
}

/**
 * Auto-rebuild Redis category sets from actual video data
 * Uses Redis lock to prevent concurrent rebuilds
 */
async function autoRebuildCategorySets(): Promise<boolean> {
  const LOCK_KEY = 'videos:rebuild-lock'
  const LOCK_TTL = 30 // 30 seconds timeout

  try {
    // Try to acquire lock (NX = only set if not exists, EX = expiry in seconds)
    const lockAcquired = await kv.set(LOCK_KEY, Date.now(), { nx: true, ex: LOCK_TTL })

    if (!lockAcquired) {
      console.log('[VideoManager] ⏭️ Rebuild already in progress, skipping...')
      return false
    }

    console.log('[VideoManager] 🔧 Auto-rebuilding category sets (lock acquired)...')

    // Get all videos from actual data (paginated so we never drop videos
    // beyond the first page before deleting the indexes)
    const allVideos = await getAllVideosComplete()
    console.log(`[VideoManager] Found ${allVideos.length} videos to rebuild`)

    if (allVideos.length === 0) {
      console.warn('[VideoManager] No videos found, skipping rebuild')
      await kv.del(LOCK_KEY)
      return false
    }

    // Clear existing category sets
    const categories: VideoCategory[] = ['Leadership', 'AI Works', 'Health', 'Entertaining', 'Human Philosophy']
    await Promise.all(categories.map(cat => kv.del(`videos:${cat}`)))

    // Rebuild category sets
    const categoryStats: Record<string, number> = {}
    for (const video of allVideos) {
      await kv.sadd(`videos:${video.category}`, video.id)
      categoryStats[video.category] = (categoryStats[video.category] || 0) + 1
    }

    // Rebuild videos:all sorted set
    await kv.del('videos:all')
    for (const video of allVideos) {
      await kv.zadd('videos:all', { score: video.addedAt, member: video.id })
    }

    console.log('[VideoManager] ✅ Auto-rebuild completed:', categoryStats)

    // Release lock
    await kv.del(LOCK_KEY)
    return true
  } catch (error) {
    console.error('[VideoManager] ❌ Auto-rebuild failed:', error)
    // Release lock on error
    await kv.del(LOCK_KEY).catch(() => {})
    return false
  }
}

/**
 * Get video statistics with automatic inconsistency detection and auto-repair
 */
export async function getVideoStats() {
  try {
    const [leadership, aiWorks, health, entertaining, philosophy, total] = await Promise.all([
      kv.scard('videos:Leadership'),
      kv.scard('videos:AI Works'),
      kv.scard('videos:Health'),
      kv.scard('videos:Entertaining'),
      kv.scard('videos:Human Philosophy'),
      kv.zcard('videos:all'),
    ])

    let stats = {
      leadership: leadership || 0,
      aiWorks: aiWorks || 0,
      health: health || 0,
      entertaining: entertaining || 0,
      philosophy: philosophy || 0,
      total: total || 0,
    }

    // Detect inconsistency: if category counts don't sum to total, Redis sets are out of sync
    const categorySum = stats.leadership + stats.aiWorks + stats.health + stats.entertaining + stats.philosophy

    if (categorySum !== stats.total && stats.total > 0) {
      console.warn(`[VideoManager] ⚠️ Inconsistency detected: category sum (${categorySum}) != total (${stats.total})`)
      console.warn('[VideoManager] 🔧 Triggering auto-rebuild...')

      // Auto-rebuild with lock protection
      const rebuilt = await autoRebuildCategorySets()

      if (rebuilt) {
        // Fetch fresh stats after successful rebuild
        const [newLeadership, newAiWorks, newHealth, newEntertaining, newPhilosophy, newTotal] = await Promise.all([
          kv.scard('videos:Leadership'),
          kv.scard('videos:AI Works'),
          kv.scard('videos:Health'),
          kv.scard('videos:Entertaining'),
          kv.scard('videos:Human Philosophy'),
          kv.zcard('videos:all'),
        ])

        stats = {
          leadership: newLeadership || 0,
          aiWorks: newAiWorks || 0,
          health: newHealth || 0,
          entertaining: newEntertaining || 0,
          philosophy: newPhilosophy || 0,
          total: newTotal || 0,
        }

        console.log('[VideoManager] ✅ Returned fresh stats after auto-rebuild:', stats)
      } else {
        console.log('[VideoManager] ⏳ Rebuild in progress or failed, returning stale stats')
      }
    }

    return stats
  } catch (error) {
    console.error('Failed to get video stats:', error)
    return {
      leadership: 0,
      aiWorks: 0,
      health: 0,
      entertaining: 0,
      philosophy: 0,
      total: 0,
    }
  }
}

/**
 * Batch import videos from URLs
 */
export interface BatchImportResult {
  success: number
  failed: number
  errors: Array<{ url: string; error: string }>
}

export async function batchImportVideos(
  urls: string[],
  category: VideoCategory,
  userEmail: string
): Promise<BatchImportResult> {
  const result: BatchImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  for (const url of urls) {
    try {
      const videoId = extractVideoId(url)
      if (!videoId) {
        result.failed++
        result.errors.push({ url, error: 'Invalid YouTube URL' })
        continue
      }

      // Check if already exists
      const existing = await getVideo(videoId)
      if (existing) {
        result.failed++
        result.errors.push({ url, error: 'Video already exists' })
        continue
      }

      // Get metadata
      const metadata = await getVideoMetadata(videoId)

      // Get transcript (optional)
      let transcript = ''
      try {
        transcript = await getVideoTranscript(videoId)
      } catch (error) {
        // Continue without transcript
      }

      // Create video object with bilingual structure
      const video: Video = {
        id: videoId,
        videoId,
        channelTitle: metadata.channelTitle,
        publishedAt: metadata.publishedAt,
        thumbnailUrl: metadata.thumbnailUrl,
        duration: metadata.duration,
        category,
        // English content (from YouTube)
        en: {
          title: metadata.title,
          description: metadata.description,
          transcript: transcript || undefined,
          summary: undefined, // Will be generated later
        },
        // Vietnamese content (empty, to be translated)
        vi: {
          title: '',
          description: '',
          transcript: undefined,
          summary: undefined,
        },
        addedAt: Date.now(),
        addedBy: userEmail,
        translationStatus: {
          viTranslated: false,
        },
      }

      await saveVideo(video)
      result.success++
    } catch (error: any) {
      result.failed++
      result.errors.push({ url, error: error.message || 'Unknown error' })
    }
  }

  return result
}
