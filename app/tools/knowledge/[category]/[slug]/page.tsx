import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VideoPlayer } from '@/components/features/VideoPlayer'
import { TranscriptSection } from '@/components/features/TranscriptSection'
import { RelatedVideos } from '@/components/features/RelatedVideos'
import type { VideoCategory } from '@/lib/videoManager'

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

// Extract video ID from slug (format: "title-slug-videoId")
function extractVideoId(slug: string): string {
  const parts = slug.split('-')
  return parts[parts.length - 1]
}

async function getVideo(videoId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/videos`, { cache: 'no-store' })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const video = data.videos?.find((v: any) => v.videoId === videoId)
    return video || null
  } catch (error) {
    console.error('Error fetching video:', error)
    return null
  }
}

async function getVideoWithTranscript(videoId: string) {
  try {
    // Fetch from admin API to get full video with transcript
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/admin/videos`, {
      cache: 'no-store',
      headers: {
        // This is a workaround - in production you'd need proper auth
        // For now, we'll add a public endpoint or fetch transcript separately
      }
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const video = data.videos?.find((v: any) => v.videoId === videoId)
    return video || null
  } catch (error) {
    console.error('Error fetching video with transcript:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps) {
  const videoId = extractVideoId(params.slug)
  const video = await getVideo(videoId)

  if (!video) {
    return {}
  }

  return {
    title: `${video.title} | ${CATEGORY_MAPPINGS[params.category]?.name || ''} - AI Tools`,
    description: video.description.substring(0, 160),
  }
}

export default async function VideoDetailPage({ params }: PageProps) {
  const mapping = CATEGORY_MAPPINGS[params.category]

  if (!mapping) {
    notFound()
  }

  const videoId = extractVideoId(params.slug)
  const video = await getVideo(videoId)
  const fullVideo = await getVideoWithTranscript(videoId)

  if (!video) {
    notFound()
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
        <span className="text-slate-900 line-clamp-1">{video.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <VideoPlayer
            videoId={video.videoId}
            title={video.title}
          />

          {/* Video Info */}
          <div className="mt-6">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              {video.title}
            </h1>
            <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
              <span>{video.channelTitle}</span>
              <span>•</span>
              <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
            </div>

            {/* Description */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {video.description}
              </p>
            </div>
          </div>

          {/* Transcript Section */}
          {fullVideo?.transcript && (
            <TranscriptSection transcript={fullVideo.transcript} />
          )}
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
