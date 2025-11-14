'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface BlogPost {
  id: string
  slug: string
  publishedAt?: number
  createdAt: number
  en: { title: string; description: string; content: string }
  vi: { title: string; description: string; content: string }
  tags: string[]
  image?: string
  readingTime?: number
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const { t, language } = useLanguage()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`/api/content/blog/${params.slug}`)
        if (!res.ok) {
          setNotFoundError(true)
          return
        }
        const data = await res.json()
        setPost(data)
      } catch (error) {
        console.error('Failed to fetch blog post:', error)
        setNotFoundError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [params.slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (notFoundError || !post) {
    notFound()
  }

  const content = language === 'vi' && post.vi.title ? post.vi : post.en
  const date = new Date(post.publishedAt || post.createdAt).toISOString()

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
          <h1 className="text-4xl font-bold text-slate-900">{content.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-slate-600">
            <time dateTime={date}>{formatDate(date)}</time>
            {post.readingTime && (
              <>
                <span>•</span>
                <span>{post.readingTime} {t('blog.minRead')}</span>
              </>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
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

        {/* Featured image */}
        {post.image && (
          <div className="relative mt-8 h-96 w-full overflow-hidden rounded-lg bg-slate-100">
            <img
              src={post.image}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate prose-lg mt-12 max-w-none">
          <MDXRemote
            source={content.content}
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
