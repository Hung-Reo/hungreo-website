/**
 * YouTube Video Management with Vercel KV
 * Handles categorized video library with transcripts
 */

import { kv } from '@vercel/kv'
import { YoutubeTranscript } from 'youtube-transcript'
import axios from 'axios'

export type VideoCategory = 'Leadership' | 'AI Works' | 'Health' | 'Entertaining' | 'Human Philosophy'

export interface Video {
  id: string
  videoId: string
  title: string
  channelTitle: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory
  transcript?: string
  summary?: string
  addedAt: number
  addedBy: string
  pineconeIds?: string[]
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
 * Get video transcript
 */
export async function getVideoTranscript(videoId: string): Promise<string> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId)
    return transcript.map((t) => t.text).join(' ')
  } catch (error) {
    console.error('Failed to get transcript:', error)
    // Fallback to description if transcript not available
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
    const video = await kv.get<Video>(`video:${videoId}`)
    return video
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
 * Update video category
 */
export async function updateVideoCategory(videoId: string, newCategory: VideoCategory): Promise<void> {
  try {
    const video = await getVideo(videoId)
    if (!video) {
      throw new Error('Video not found')
    }

    const oldCategory = video.category

    // Update video
    const updatedVideo = { ...video, category: newCategory }
    await kv.set(`video:${videoId}`, updatedVideo)

    // Update category lists
    await kv.srem(`videos:${oldCategory}`, videoId)
    await kv.sadd(`videos:${newCategory}`, videoId)
  } catch (error) {
    console.error('Failed to update video category:', error)
    throw new Error('Failed to update video category')
  }
}

/**
 * Delete video
 */
export async function deleteVideo(videoId: string): Promise<void> {
  try {
    const video = await getVideo(videoId)
    if (!video) {
      throw new Error('Video not found')
    }

    // Remove from KV
    await kv.del(`video:${videoId}`)
    await kv.srem(`videos:${video.category}`, videoId)
    await kv.zrem('videos:all', videoId)

    // TODO: Also remove from Pinecone if exists
  } catch (error) {
    console.error('Failed to delete video:', error)
    throw new Error('Failed to delete video')
  }
}

/**
 * Get video statistics
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

    return {
      leadership: leadership || 0,
      aiWorks: aiWorks || 0,
      health: health || 0,
      entertaining: entertaining || 0,
      philosophy: philosophy || 0,
      total: total || 0,
    }
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

      // Create video object
      const video: Video = {
        id: videoId,
        videoId,
        ...metadata,
        category,
        transcript,
        addedAt: Date.now(),
        addedBy: userEmail,
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
