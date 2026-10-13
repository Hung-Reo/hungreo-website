import {
  getVideosByCategory,
  normalizeVideo,
  toPublicVideo,
  type Video,
  type VideoCategory,
} from './videoManager'

export type RelatedVideo = ReturnType<typeof toPublicVideo>

/**
 * Related videos for a detail page, read straight from KV.
 *
 * This used to fetch our own /api/videos over HTTP via VERCEL_URL. That host is
 * the per-deployment URL, which deployment protection answers with the Vercel
 * SSO HTML page, so response.json() threw "Unexpected token '<'" and the block
 * was silently hidden on Production.
 */
export async function loadRelatedVideos(
  category: VideoCategory,
  currentVideoId: string,
  limit: number = 5,
  loadByCategory: (category: VideoCategory) => Promise<Video[]> = getVideosByCategory
): Promise<RelatedVideo[]> {
  try {
    const videos = await loadByCategory(category)
    return videos
      .filter((video) => video.id !== currentVideoId)
      .slice(0, limit)
      .map((video) => toPublicVideo(normalizeVideo(video)))
  } catch (error) {
    // The sidebar is optional; the detail page must still render.
    console.error('Error loading related videos:', error)
    return []
  }
}
