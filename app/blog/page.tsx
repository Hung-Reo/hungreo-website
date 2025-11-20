'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import type { BlogPost } from '@/lib/contentManager'
import { Loader2, Clock, Calendar, Star } from 'lucide-react'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function BlogPage() {
  const { language } = useLanguage()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch('/api/content/blog')
      if (!res.ok) throw new Error('Failed to load blog posts')

      const data = await res.json()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !posts) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Failed to load blog posts</p>
      </div>
    )
  }

  const lang = language === 'en' ? 'en' : 'vi'

  // Get all unique categories
  const allCategories = Array.from(
    new Set(posts.map((p) => p.category).filter(Boolean))
  ).sort()

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    // Category filter
    if (selectedCategory && post.category !== selectedCategory) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle =
        post.en.title.toLowerCase().includes(query) ||
        post.vi.title?.toLowerCase().includes(query)
      const matchesTags = post.tags.some((tag) => tag.toLowerCase().includes(query))
      const matchesCategory = post.category?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesTags && !matchesCategory) return false
    }

    return true
  })

  // Separate featured and regular posts
  const featuredPosts = filteredPosts.filter((p) => p.featured)
  const regularPosts = filteredPosts.filter((p) => !p.featured)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {lang === 'en' ? 'Blog' : 'Blog'}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Thoughts, ideas, and insights on product management, technology, and personal growth.'
              : 'Suy nghĩ, ý tưởng và quan điểm về quản lý sản phẩm, công nghệ và phát triển bản thân.'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder={
              lang === 'en' ? 'Search posts by title, category, or tags...' : 'Tìm kiếm bài viết...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Category Filter */}
        {allCategories.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              {lang === 'en' ? 'Filter by Category:' : 'Lọc theo danh mục:'}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lang === 'en' ? 'All' : 'Tất cả'} ({posts.length})
              </button>
              {allCategories.map((category) => {
                const count = posts.filter((p) => p.category === category).length
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {category} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-600">
              {lang === 'en'
                ? 'No blog posts found matching your filters.'
                : 'Không tìm thấy bài viết nào phù hợp.'}
            </p>
            <button
              onClick={() => {
                setSelectedCategory(null)
                setSearchQuery('')
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {lang === 'en' ? 'Clear filters' : 'Xóa bộ lọc'}
            </button>
          </div>
        )}

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold text-slate-900">
                {lang === 'en' ? 'Featured Posts' : 'Bài viết nổi bật'}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} lang={lang} router={router} featured />
              ))}
            </div>
          </section>
        )}

        {/* Regular Posts */}
        {regularPosts.length > 0 && (
          <section>
            {featuredPosts.length > 0 && (
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {lang === 'en' ? 'All Posts' : 'Tất cả bài viết'}
              </h2>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} lang={lang} router={router} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

interface BlogPostCardProps {
  post: BlogPost
  lang: 'en' | 'vi'
  router: any
  featured?: boolean
}

function BlogPostCard({ post, lang, router, featured = false }: BlogPostCardProps) {
  const publishDate = post.publishedAt
    ? formatDate(new Date(post.publishedAt).toISOString())
    : formatDate(new Date(post.createdAt).toISOString())

  return (
    <article
      onClick={() => router.push(`/blog/${post.slug}`)}
      className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="flex-shrink-0 overflow-hidden bg-slate-100 aspect-video w-full">
          <img
            src={post.featuredImage}
            alt={post[lang].title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Category */}
        {post.category && (
          <div className="mb-3">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-primary-600 transition-colors">
          {post[lang].title}
        </h3>

        {/* Excerpt */}
        <p className="text-slate-600 mb-4 line-clamp-2">
          {post[lang].excerpt}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-slate-500">
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-xs text-slate-500">+{post.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 pt-4 border-t text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{publishDate}</span>
          </div>
          {post.readTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readTime} min read</span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
