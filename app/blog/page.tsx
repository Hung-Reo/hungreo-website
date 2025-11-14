'use client'

import { useState, useEffect } from 'react'
import { BlogPostCard } from '@/components/features/BlogPostCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'

interface BlogPost {
  id: string
  slug: string
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
  publishedAt?: number
  en: { title: string; description: string; content: string }
  vi: { title: string; description: string; content: string }
  tags: string[]
  image?: string
  featured: boolean
  readingTime?: number
}

export default function BlogPage() {
  const { t, language } = useLanguage()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/admin/content/blog?status=published', {
          next: { revalidate: 60 }, // ISR: 60 seconds
        })
        if (res.ok) {
          const data = await res.json()
          // Sort by publishedAt or createdAt, newest first
          const sorted = data.sort((a: BlogPost, b: BlogPost) => {
            const dateA = a.publishedAt || a.createdAt
            const dateB = b.publishedAt || b.createdAt
            return dateB - dateA
          })
          setPosts(sorted)
        }
      } catch (error) {
        console.error('Failed to fetch blog posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-slate-900">{t('blog.title')}</h1>
        <p className="mt-4 text-xl text-slate-600">
          {t('blog.subtitle')}
        </p>

        <div className="mt-12 space-y-6">
          {posts.map((post) => {
            const content = language === 'vi' && post.vi.title ? post.vi : post.en
            return (
              <BlogPostCard
                key={post.slug}
                post={{
                  slug: post.slug,
                  title: content.title,
                  description: content.description,
                  date: new Date(post.publishedAt || post.createdAt).toISOString(),
                  tags: post.tags,
                }}
              />
            )
          })}
        </div>

        {posts.length === 0 && (
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
