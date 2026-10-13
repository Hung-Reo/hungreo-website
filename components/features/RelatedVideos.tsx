import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import type { VideoCategory } from '@/lib/videoManager'
import { createVideoSlug } from '@/lib/knowledge'
import { loadRelatedVideos } from '@/lib/relatedVideos'

interface RelatedVideosProps {
  category: VideoCategory
  categorySlug: string
  currentVideoId: string
}

export async function RelatedVideos({ category, categorySlug, currentVideoId }: RelatedVideosProps) {
  // @vercel/kv fetches with cache: 'default', which Next 14 keeps in the Data
  // Cache indefinitely even on force-dynamic pages; newly added videos must show.
  noStore()
  const videos = await loadRelatedVideos(category, currentVideoId)

  if (videos.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-4 font-semibold text-slate-900">
        Related Videos
      </h3>

      <div className="space-y-4">
        {videos.map((video) => {
          // Use bilingual title with fallback
          const displayTitle = video.en?.title || video.title || 'Untitled Video'

          return (
            <Link
              key={video.id}
              href={`/tools/knowledge/${categorySlug}/${createVideoSlug(video.videoId, displayTitle)}`}
              className="group block"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                  <Image
                    src={video.thumbnailUrl}
                    alt={displayTitle}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h4 className="mb-1 line-clamp-2 text-sm font-medium text-slate-900 group-hover:text-primary-600">
                    {displayTitle}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {video.channelTitle}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
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
