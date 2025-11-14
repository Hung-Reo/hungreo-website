'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Trash2, Edit, Plus, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface BlogPost {
  id: string
  slug: string
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
  publishedAt?: number
  en: { title: string; description: string }
  vi: { title: string; description: string }
  tags: string[]
  featured: boolean
  readingTime?: number
}

type StatusFilter = 'all' | 'published' | 'draft'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [filter])

  async function fetchPosts() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/content/blog?status=${filter}`)
      if (!res.ok) throw new Error('Failed to fetch blog posts')
      const data = await res.json()
      setPosts(data)
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

      // Remove from list
      setPosts(posts.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete blog post')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
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

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({posts.length})
        </Button>
        <Button
          variant={filter === 'published' ? 'default' : 'outline'}
          onClick={() => setFilter('published')}
          size="sm"
        >
          Published
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          onClick={() => setFilter('draft')}
          size="sm"
        >
          Drafts
        </Button>
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
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-600">No blog posts found.</p>
              <Link href="/admin/content/blog/new">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Post
                </Button>
              </Link>
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
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Reading Time
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
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-900">
                            {post.en.title}
                          </div>
                          {post.vi.title && (
                            <div className="text-sm text-slate-600">
                              {post.vi.title}
                            </div>
                          )}
                        </div>
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
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="text-xs text-slate-500">
                              +{post.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {post.readingTime || 0} min
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(new Date(post.updatedAt).toISOString())}
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
                            onClick={() => handleDelete(post.id, post.en.title)}
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
