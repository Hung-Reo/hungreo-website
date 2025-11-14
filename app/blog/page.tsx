'use client'

import { BlogPostCard } from '@/components/features/BlogPostCard'
import { getContentByType, PostMeta } from '@/lib/mdx'
import { useLanguage } from '@/contexts/LanguageContext'

export default function BlogPage() {
  const { t } = useLanguage()
  const posts = getContentByType<PostMeta>('blog')

  // Sort by date, newest first
  const sortedPosts = posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900">{t('blog.title')}</h1>
        <p className="mt-4 text-xl text-slate-600">
          {t('blog.subtitle')}
        </p>

        <div className="mt-12 space-y-6">
          {sortedPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>

        {sortedPosts.length === 0 && (
          <div className="mt-12 rounded-lg border bg-white p-12 text-center">
            <p className="text-slate-600">
              {t('blog.empty')}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t('blog.emptySubtitle')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
