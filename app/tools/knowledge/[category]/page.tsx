import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VideoGrid } from '@/components/features/VideoGrid'
import { getBaseUrl } from '@/lib/getBaseUrl'
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
  }
}

export function generateMetadata({ params }: PageProps) {
  const mapping = CATEGORY_MAPPINGS[params.category]
  if (!mapping) return {}

  return {
    title: `${mapping.name} Videos | AI Tools - Hung Dinh`,
    description: `Browse curated ${mapping.name} videos with AI-powered summaries and Q&A.`,
  }
}

async function getVideos(category: VideoCategory) {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(
      `${baseUrl}/api/videos?category=${encodeURIComponent(category)}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      console.error('Failed to fetch videos')
      return []
    }

    const data = await response.json()
    return data.videos || []
  } catch (error) {
    console.error('Error fetching videos:', error)
    return []
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const mapping = CATEGORY_MAPPINGS[params.category]

  if (!mapping) {
    notFound()
  }

  const videos = await getVideos(mapping.category)

  return (
    <div className="container mx-auto px-4 py-12">
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
        <span className="text-slate-900">{mapping.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold text-slate-900">
          {mapping.name} Videos
        </h1>
        <p className="text-lg text-slate-600">
          {videos.length} video{videos.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Video Grid */}
      {videos.length > 0 ? (
        <VideoGrid videos={videos} categorySlug={params.category} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            No videos available in this category yet.
          </p>
          <Link
            href="/tools/knowledge"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700"
          >
            ← Back to all categories
          </Link>
        </div>
      )}
    </div>
  )
}
