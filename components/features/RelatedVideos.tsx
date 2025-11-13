import Link from 'next/link'
import Image from 'next/image'
import { getBaseUrl } from '@/lib/getBaseUrl'
import type { VideoCategory } from '@/lib/videoManager'

interface RelatedVideosProps {
  category: VideoCategory
  categorySlug: string
  currentVideoId: string
}

async function getRelatedVideos(category: VideoCategory, currentVideoId: string, limit: number = 5) {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(
      `${baseUrl}/api/videos?category=${encodeURIComponent(category)}`,
      { next: { revalidate: 60 } }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const videos = data.videos || []

    // Filter out current video and limit results
    return videos
      .filter((v: any) => v.id !== currentVideoId)
      .slice(0, limit)
  } catch (error) {
    console.error('Error fetching related videos:', error)
    return []
  }
}

// Create slug from video ID
function createVideoSlug(videoId: string, title: string): string {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50)
  return `${titleSlug}-${videoId}`
}

export async function RelatedVideos({ category, categorySlug, currentVideoId }: RelatedVideosProps) {
  const videos = await getRelatedVideos(category, currentVideoId)

  if (videos.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 font-semibold text-slate-900">
        Related Videos
      </h3>

      <div className="space-y-4">
        {videos.map((video: any) => (
          <Link
            key={video.id}
            href={`/tools/knowledge/${categorySlug}/${createVideoSlug(video.videoId, video.title)}`}
            className="group block"
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h4 className="mb-1 line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-primary-600">
                  {video.title}
                </h4>
                <p className="text-xs text-slate-600">
                  {video.channelTitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View all link */}
      <Link
        href={`/tools/knowledge/${categorySlug}`}
        className="mt-4 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        View all {category} videos →
      </Link>
    </div>
  )
}
