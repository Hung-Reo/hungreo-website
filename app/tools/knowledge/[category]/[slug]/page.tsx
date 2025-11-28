import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { RelatedVideos } from '@/components/features/RelatedVideos'
import { getVideo as getVideoFromDB, normalizeVideo, type VideoCategory } from '@/lib/videoManager'

const CATEGORY_MAPPINGS: Record<string, { name: string; category: VideoCategory }> = {
  'leadership': { name: 'Leadership', category: 'Leadership' },
  'ai-works': { name: 'AI Works', category: 'AI Works' },
  'health': { name: 'Health', category: 'Health' },
  'entertaining': { name: 'Entertaining', category: 'Entertaining' },
  'human-philosophy': { name: 'Human Philosophy', category: 'Human Philosophy' },
}

interface PageProps {
  params: {
    category: string
    slug: string
  }
}

// Create slug from video ID and title
function createVideoSlug(videoId: string, title: string): string {
  const effectiveTitle = title.trim() || 'video'
  const titleSlug = effectiveTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 50)
  return `${titleSlug}-${videoId}`
}

// Extract video ID from slug (format: "title-slug-videoId")
// YouTube video IDs are typically 11 characters long and can contain letters, numbers, hyphens, and underscores
function extractVideoId(slug: string): string {
  // YouTube video IDs are 11 characters long
  // Extract the last 11 characters as they should be the video ID
  // This works even if the title part is empty (slug like "-videoId")
  if (slug.length >= 11) {
    return slug.slice(-11)
  }
  // Fallback: take the last part after splitting by dash
  const parts = slug.split('-')
  return parts[parts.length - 1]
}

// Force dynamic rendering to avoid serving stale 404 pages
export const dynamic = 'force-dynamic'
// Allow any slug format to be processed (important for legacy URLs)
export const dynamicParams = true

// Helper function to get video data directly from database
// This avoids server-to-server HTTP requests which can fail
async function getVideo(videoId: string) {
  try {
    const video = await getVideoFromDB(videoId)
    if (!video) return null
    return normalizeVideo(video)
  } catch (error) {
    console.error('Error fetching video:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const videoId = extractVideoId(params.slug)
  const video = await getVideo(videoId)

  if (!video) {
    return {}
  }

  // Use bilingual content with fallback
  const title = video.en?.title || video.title || 'Video'
  const description = video.en?.description || video.description || ''

  return {
    title: `${title} | ${CATEGORY_MAPPINGS[params.category]?.name || ''} - AI Tools`,
    description: description.substring(0, 160),
  }
}

export default async function VideoDetailPage({ params }: PageProps) {
  const mapping = CATEGORY_MAPPINGS[params.category]

  if (!mapping) {
    notFound()
  }

  const videoId = extractVideoId(params.slug)
  const video = await getVideo(videoId)

  if (!video) {
    notFound()
  }

  // Use bilingual content with fallback to legacy fields
  const displayTitle = video.en?.title || video.title || 'Untitled Video'
  const displayDescription = video.en?.description || video.description || ''

  // Redirect to correct slug if current slug doesn't match expected format
  // This handles legacy URLs like "-videoId" and redirects to proper "title-videoId" format
  const correctSlug = createVideoSlug(video.videoId, displayTitle)
  if (params.slug !== correctSlug) {
    redirect(`/tools/knowledge/${params.category}/${correctSlug}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <span>›</span>
        <Link href="/tools/knowledge" className="hover:text-primary-600">
          AI Tools
        </Link>
        <span>›</span>
        <Link href={`/tools/knowledge/${params.category}`} className="hover:text-primary-600">
          {mapping.name}
        </Link>
        <span>›</span>
        <span className="text-slate-900 line-clamp-1">{displayTitle}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <VideoPlayer
            videoId={video.videoId}
            title={displayTitle}
          />

          {/* Video Info */}
          <div className="mt-6">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              {displayTitle}
            </h1>
            <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
              <span>{video.channelTitle}</span>
              <span>•</span>
              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
            </div>

            {/* Description */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {displayDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Related Videos */}
          <RelatedVideos
            category={mapping.category}
            categorySlug={params.category}
            currentVideoId={video.id}
          />
        </div>
      </div>

      {/* Context info for ChatBot */}
      <div className="mt-8 rounded-lg border border-primary-200 bg-primary-50 p-6">
        <h3 className="mb-2 flex items-center gap-2 font-semibold text-primary-900">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Ask AI about this video
        </h3>
        <p className="text-sm text-primary-800">
          Open the chatbot (bottom right corner) and ask questions about this video.
          The AI has been trained on the video's content and can provide context-aware answers!
        </p>
      </div>
    </div>
  )
}
