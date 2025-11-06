import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { PostMeta } from '@/lib/mdx'

interface BlogPostCardProps {
  post: PostMeta
}

export function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block rounded-lg border bg-white p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900">
            {post.title}
          </h3>
          <p className="mt-2 text-slate-600">{post.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.tags && (
              <div className="flex gap-2">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-primary-600">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="text-primary-600">→</div>
      </div>
    </Link>
  )
}
