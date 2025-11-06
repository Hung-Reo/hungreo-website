import { Metadata } from 'next'
import { BlogPostCard } from '@/components/features/BlogPostCard'
import { getContentByType, PostMeta } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Blog - Hung Dinh',
  description: 'Thoughts on product management, AI, and lessons learned',
}

export default function BlogPage() {
  const posts = getContentByType<PostMeta>('blog')

  // Sort by date, newest first
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900">Blog</h1>
        <p className="mt-4 text-xl text-slate-600">
          Thoughts on product management, AI, and lessons learned along the way
        </p>

        <div className="mt-12 space-y-6">
          {sortedPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>

        {sortedPosts.length === 0 && (
          <div className="mt-12 rounded-lg border bg-white p-12 text-center">
            <p className="text-slate-600">
              Blog posts coming soon... Stay tuned! ✍️
            </p>
            <p className="mt-2 text-sm text-slate-500">
              First posts will cover BA to PM transition and AI learnings
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
