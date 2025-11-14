'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for Markdown editor (client-side only)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface BlogPostData {
  id?: string
  slug: string
  status: 'draft' | 'published'
  en: { title: string; description: string; content: string }
  vi: { title: string; description: string; content: string }
  tags: string[]
  image?: string
  featured: boolean
}

export default function BlogEditorPage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const isNew = params.id === 'new'

  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<BlogPostData>({
    slug: '',
    status: 'draft',
    en: { title: '', description: '', content: '' },
    vi: { title: '', description: '', content: '' },
    tags: [],
    featured: false,
  })

  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!isNew) {
      fetchPost()
    }
  }, [params.id])

  async function fetchPost() {
    try {
      const res = await fetch(`/api/admin/content/blog/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch blog post')
      const data = await res.json()
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    // Validation
    if (!formData.en.title.trim()) {
      alert('English title is required')
      return
    }
    if (!formData.en.description.trim()) {
      alert('English description is required')
      return
    }

    setSaving(true)
    try {
      const url = isNew
        ? '/api/admin/content/blog'
        : `/api/admin/content/blog/${params.id}`

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save blog post')
      }

      const { post } = await res.json()

      // Redirect to edit page if new, or stay if editing
      if (isNew) {
        router.push(`/admin/content/blog/${post.id}`)
      } else {
        alert('Blog post saved successfully!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save blog post')
    } finally {
      setSaving(false)
    }
  }

  function addTag() {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  function removeTag(tag: string) {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'Create Blog Post' : 'Edit Blog Post'}
            </h1>
            {!isNew && (
              <p className="text-sm text-slate-600 mt-1">ID: {params.id}</p>
            )}
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Metadata Section */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Metadata</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="blog-post-slug (auto-generated from title)"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as 'draft' | 'published',
                })
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Featured Image URL
            </label>
            <input
              type="text"
              value={formData.image || ''}
              onChange={(e) =>
                setFormData({ ...formData, image: e.target.value })
              }
              placeholder="https://..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="rounded"
              />
              Featured (show on homepage)
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Add tag (press Enter)"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
            />
            <Button type="button" onClick={addTag} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Language Tabs */}
      <div className="bg-white border rounded-lg">
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('en')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'en'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setActiveTab('vi')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'vi'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tiếng Việt
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'en' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.en.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      en: { ...formData.en, title: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.en.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      en: { ...formData.en, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content (Markdown)
                </label>
                <div data-color-mode="light">
                  <MDEditor
                    value={formData.en.content}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        en: { ...formData.en, content: val || '' },
                      })
                    }
                    height={400}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title (Tiếng Việt)
                </label>
                <input
                  type="text"
                  value={formData.vi.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vi: { ...formData.vi, title: e.target.value },
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description (Tiếng Việt)
                </label>
                <textarea
                  value={formData.vi.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      vi: { ...formData.vi, description: e.target.value },
                    })
                  }
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Content (Markdown)
                </label>
                <div data-color-mode="light">
                  <MDEditor
                    value={formData.vi.content}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        vi: { ...formData.vi, content: val || '' },
                      })
                    }
                    height={400}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save button at bottom */}
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Post
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
