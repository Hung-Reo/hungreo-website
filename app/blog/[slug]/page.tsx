'use client'

import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { formatDate, readingTime } from '@/lib/utils'
import { getContentBySlug, getContentByType, PostMeta } from '@/lib/mdx'
import { useLanguage } from '@/contexts/LanguageContext'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export function generateStaticParams() {
  const posts = getContentByType<PostMeta>('blog')
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const { t } = useLanguage()
  let content, meta

  try {
    const result = getContentBySlug('blog', params.slug)
    content = result.content
    meta = result.meta
  } catch {
    notFound()
  }

  const readTime = readingTime(content)

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Back button */}
        <Link
          href="/blog"
          className="inline-flex items-center text-sm text-slate-600 hover:text-primary-600"
        >
          {t('blog.backToBlog')}
        </Link>

        {/* Header */}
        <header className="mt-8">
          <h1 className="text-4xl font-bold text-slate-900">{meta.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-slate-600">
            <time dateTime={meta.date}>{formatDate(meta.date)}</time>
            <span>•</span>
            <span>{readTime} {t('blog.minRead')}</span>
          </div>
          {meta.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-sm font-medium text-primary-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-slate prose-lg mt-12 max-w-none">
          <MDXRemote
            source={content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeHighlight],
              },
            }}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t pt-8">
          <p className="text-slate-600">
            {t('blog.thanks')}{' '}
            <a
              href="https://linkedin.com/in/yourprofile"
              className="text-primary-600 hover:underline"
            >
              {t('blog.linkedin')}
            </a>
            .
          </p>
        </footer>
      </div>
    </article>
  )
}
