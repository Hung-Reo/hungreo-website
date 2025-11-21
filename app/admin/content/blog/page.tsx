'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Trash2, Edit, Plus, Loader2, Search, FileText, BookOpen, Star as StarIcon, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface BlogPost {
  id: string
  slug: string
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
  publishedAt?: number
  en: { title: string; excerpt: string }
  vi: { title: string; excerpt: string }
  category: string
  tags: string[]
  featured: boolean
  readTime: number
}

interface Stats {
  total: number
  draft: number
  published: number
  featured: number
}

type StatusFilter = 'all' | 'published' | 'draft'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, draft: 0, published: 0, featured: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/content/blog')
      if (!res.ok) throw new Error('Failed to fetch blog posts')
      const data = await res.json()

      // Filter out invalid posts (posts without titles)
      const validPosts = (data.posts || []).filter((p: BlogPost) => p.en?.title)

      setPosts(validPosts)

      // Recalculate stats based on valid posts only
      setStats({
        total: validPosts.length,
        draft: validPosts.filter((p: BlogPost) => p.status === 'draft').length,
        published: validPosts.filter((p: BlogPost) => p.status === 'published').length,
        featured: validPosts.filter((p: BlogPost) => p.featured).length,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/content/blog/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete blog post')

      toast.success('Blog post deleted successfully')
      // Remove from list and update stats
      const updatedPosts = posts.filter(p => p.id !== id)
      setPosts(updatedPosts)
      setStats({
        total: updatedPosts.length,
        draft: updatedPosts.filter(p => p.status === 'draft').length,
        published: updatedPosts.filter(p => p.status === 'published').length,
        featured: updatedPosts.filter(p => p.featured).length,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete blog post')
    } finally {
      setDeleting(null)
    }
  }

  // Get unique categories
  const categories = Array.from(new Set(posts.map(p => p.category).filter(Boolean))).sort()

  // Filter posts
  const filteredPosts = posts.filter(post => {
    // Filter out posts without title (invalid/corrupted data)
    if (!post.en?.title) return false

    // Status filter
    if (statusFilter !== 'all' && post.status !== statusFilter) return false

    // Category filter
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = post.en?.title?.toLowerCase().includes(query) ||
                          post.vi?.title?.toLowerCase().includes(query)
      const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(query))
      const matchesCategory = post.category?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesTags && !matchesCategory) return false
    }

    return true
  })

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Blog Posts</h1>
          <p className="text-slate-600 mt-1">Manage your blog content</p>
        </div>
        <Link href="/admin/content/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Posts</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Published</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Drafts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
            </div>
            <Edit className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Featured</p>
              <p className="text-2xl font-bold text-amber-600">{stats.featured}</p>
            </div>
            <StarIcon className="h-8 w-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, category, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'published' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('published')}
            size="sm"
          >
            Published
          </Button>
          <Button
            variant={statusFilter === 'draft' ? 'default' : 'outline'}
            onClick={() => setStatusFilter('draft')}
            size="sm"
          >
            Drafts
          </Button>
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Blog Posts Table */}
      {!loading && !error && (
        <>
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-600">
                {posts.length === 0
                  ? 'No blog posts found.'
                  : 'No posts match your filters.'}
              </p>
              {posts.length === 0 && (
                <Link href="/admin/content/blog/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Post
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Read Time
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Featured
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {post.en?.title || 'Untitled'}
                          </div>
                          {post.vi?.title && (
                            <div className="text-sm text-slate-600">
                              {post.vi.title}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {post.category && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                            {post.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {post.status === 'published' ? '✓ Published' : '○ Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {post.tags?.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags && post.tags.length > 2 && (
                            <span className="text-xs text-slate-500">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {post.readTime || 0} min
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {post.updatedAt ? formatDate(new Date(post.updatedAt).toISOString()) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {post.featured && (
                          <span className="text-yellow-600">⭐</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/content/blog/${post.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(post.id, post.en?.title || 'Untitled')}
                            disabled={deleting === post.id}
                          >
                            {deleting === post.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
