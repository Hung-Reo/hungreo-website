import Link from 'next/link'
import { notFound } from 'next/navigation'
import { VideoGrid } from '@/components/features/VideoGrid'
import { getVideosByCategory } from '@/lib/videoManager'
import { CATEGORY_MAPPINGS } from '@/lib/knowledge'
import { BASE_URL } from '@/lib/metadata'


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
    alternates: {
      canonical: `${BASE_URL}/tools/knowledge/${params.category}`,
    },
  }
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

export default async function CategoryPage({ params }: PageProps) {
  const mapping = CATEGORY_MAPPINGS[params.category]

  if (!mapping) {
    notFound()
  }

  const videos = await getVideosByCategory(mapping.category)

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
