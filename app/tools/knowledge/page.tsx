import { CategoryGrid } from '@/components/features/CategoryGrid'
import { getBaseUrl } from '@/lib/getBaseUrl'

export const metadata = {
  title: 'AI Tools - Video Library | Hung Dinh',
  description: 'Browse curated YouTube videos organized by category: Leadership, AI Works, Health, Entertaining, and Human Philosophy.',
}

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

async function getVideoStats() {
  try {
    const baseUrl = getBaseUrl()
    const response = await fetch(`${baseUrl}/api/videos?stats=true`, {
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Failed to fetch video stats')
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching video stats:', error)
    return null
  }
}

export default async function KnowledgePage() {
  const stats = await getVideoStats()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-slate-900">
          AI Tools - Video Library
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Explore curated videos organized by category. Each video includes AI-powered summaries
          and an intelligent chatbot to help you understand the content better.
        </p>
      </div>

      {/* Category Grid */}
      <CategoryGrid stats={stats} />

      {/* Info Section */}
      <div className="mt-16 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">
          How it works
        </h2>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600">•</span>
            <span>Browse videos by category: Leadership, AI Works, Health, Entertaining, or Human Philosophy</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">•</span>
            <span>Each video page includes the full transcript and an AI chatbot</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">•</span>
            <span>Ask questions about the video content and get instant, context-aware answers</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
