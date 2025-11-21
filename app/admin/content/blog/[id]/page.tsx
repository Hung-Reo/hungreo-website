'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  ArrowLeft, Save, Loader2, Sparkles, X, Plus, Clock, ExternalLink, RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { BilingualTabs } from '@/components/admin/BilingualTabs'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { StatusToggle } from '@/components/admin/StatusToggle'

interface BlogPostData {
  id?: string
  slug: string
  status: 'draft' | 'published'
  en: { title: string; excerpt: string; content: string }
  vi: { title: string; excerpt: string; content: string }
  category: string
  tags: string[]
  featuredImage?: string
  readTime?: number
  featured: boolean
  source?: {
    rawDraft: string
    detectedLanguage: 'en' | 'vi'
  }
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

  // Polish flow state
  const [showPolishFlow, setShowPolishFlow] = useState(isNew)
  const [rawDraft, setRawDraft] = useState('')
  const [polishing, setPolishing] = useState(false)

  // Form state
  const [formData, setFormData] = useState<BlogPostData | null>(null)
  const [sourceInfo, setSourceInfo] = useState<{ rawDraft: string; detectedLanguage: 'en' | 'vi' } | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Tags and category state
  const [tagInput, setTagInput] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  useEffect(() => {
    if (!isNew) {
      fetchPost()
    }
    fetchCategories()
  }, [params.id])

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Fetch existing post
  async function fetchPost() {
    try {
      const res = await fetch(`/api/admin/content/blog/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch blog post')
      const data = await res.json()
      setFormData(data)
      setSourceInfo(data.source || null)
      setShowPolishFlow(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog post')
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories
  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/content/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  // Polish raw draft with AI
  async function handlePolishDraft() {
    if (!rawDraft.trim()) {
      toast.error('Please enter your draft content')
      return
    }

    setPolishing(true)
    try {
      const res = await fetch('/api/admin/content/blog/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDraft: rawDraft.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to polish draft')
      }

      const result = await res.json()

      // Update form with polished data
      setFormData({
        status: 'draft',
        slug: '',
        featured: false,
        en: {
          title: result.polishedData.en.title,
          excerpt: result.polishedData.en.excerpt,
          content: result.polishedData.en.content,
        },
        vi: {
          title: result.polishedData.vi.title,
          excerpt: result.polishedData.vi.excerpt,
          content: result.polishedData.vi.content,
        },
        category: result.polishedData.en.category || 'Uncategorized',
        tags: result.polishedData.en.tags || [],
        source: result.source,
      })

      setSourceInfo(result.source)
      setShowPolishFlow(false)
      toast.success('Draft polished successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to polish draft')
    } finally {
      setPolishing(false)
    }
  }

  // Regenerate polished content
  async function handleRegenerate() {
    if (!sourceInfo?.rawDraft) {
      toast.error('No source content available for regeneration')
      return
    }

    setPolishing(true)
    try {
      const res = await fetch('/api/admin/content/blog/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDraft: sourceInfo.rawDraft }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to regenerate')
      }

      const result = await res.json()

      // Update form with regenerated data
      setFormData({
        ...formData!,
        en: {
          title: result.polishedData.en.title,
          excerpt: result.polishedData.en.excerpt,
          content: result.polishedData.en.content,
        },
        vi: {
          title: result.polishedData.vi.title,
          excerpt: result.polishedData.vi.excerpt,
          content: result.polishedData.vi.content,
        },
        category: result.polishedData.en.category || formData!.category,
        tags: result.polishedData.en.tags || formData!.tags,
      })

      setHasUnsavedChanges(true)
      toast.success('Content regenerated successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to regenerate')
    } finally {
      setPolishing(false)
    }
  }

  // Add new category
  async function handleAddCategory() {
    const newCat = newCategoryInput.trim()
    if (!newCat) return

    if (categories.includes(newCat)) {
      toast.error('Category already exists')
      return
    }

    try {
      const res = await fetch('/api/admin/content/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCat }),
      })

      if (!res.ok) throw new Error('Failed to add category')

      setCategories([...categories, newCat])
      if (formData) {
        setFormData({ ...formData, category: newCat })
      }
      setNewCategoryInput('')
      setShowNewCategory(false)
      toast.success('Category added successfully!')
    } catch (error) {
      toast.error('Failed to add category')
    }
  }

  // Add tag
  function addTag() {
    if (!tagInput.trim() || !formData) return

    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-')

    if (formData.tags.includes(tag)) {
      toast.error('Tag already added')
      return
    }

    setFormData({
      ...formData,
      tags: [...formData.tags, tag],
    })
    setTagInput('')
    setHasUnsavedChanges(true)
  }

  // Remove tag
  function removeTag(tag: string) {
    if (!formData) return
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
    setHasUnsavedChanges(true)
  }

  // Save post
  async function handleSave() {
    if (!formData) return

    // Validation
    if (!formData.en?.title || !formData.en?.excerpt) {
      toast.error('Please fill in English title and excerpt')
      return
    }

    if (!formData.category) {
      toast.error('Please select a category')
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
        let errorMessage = 'Failed to save blog post'
        try {
          const errorData = await res.json()
          errorMessage = errorData.error || `Server error: ${res.status} ${res.statusText}`
        } catch (parseError) {
          errorMessage = `Server error: ${res.status} ${res.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await res.json()
      toast.success('Blog post saved successfully!')
      setHasUnsavedChanges(false)

      if (isNew && result.post) {
        router.push(`/admin/content/blog/${result.post.id}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save blog post'
      toast.error(errorMessage)
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
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

  // Show polish flow for new posts
  if (showPolishFlow && isNew) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/content/blog">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Create Blog Post</h1>
              <p className="text-sm text-slate-600 mt-1">Polish your draft with AI</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold">AI Blog Polisher</h2>
          </div>

          <p className="text-slate-600 mb-6">
            Paste your raw blog draft below. AI will polish it, improve structure, fix grammar,
            generate title & excerpt, extract tags, suggest category, and translate to both languages.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Raw Draft (English or Vietnamese)
            </label>
            <textarea
              value={rawDraft}
              onChange={(e) => setRawDraft(e.target.value)}
              placeholder="Paste your blog draft here..."
              rows={15}
              className="w-full border rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handlePolishDraft}
              disabled={polishing || !rawDraft.trim()}
              className="flex-1"
            >
              {polishing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Polishing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Polish with AI
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowPolishFlow(false)
                setFormData({
                  status: 'draft',
                  slug: '',
                  featured: false,
                  en: { title: '', excerpt: '', content: '' },
                  vi: { title: '', excerpt: '', content: '' },
                  category: 'Uncategorized',
                  tags: [],
                })
              }}
            >
              Skip & Create Manually
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!formData) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
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
        <div className="flex gap-3">
          {formData.slug && formData.status === 'published' && (
            <Button variant="outline" asChild>
              <Link href={`/blog/${formData.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
          )}
          <Button onClick={() => router.push('/admin/content/blog')} variant="outline">
            Cancel
          </Button>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bilingual Content */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <BilingualTabs activeTab={activeTab} onChange={setActiveTab} />

            <div className="p-6 space-y-6">
              {activeTab === 'en' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.en?.title || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          en: { ...formData.en, title: e.target.value },
                        })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Your blog post title"
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Excerpt *
                    </label>
                    <textarea
                      value={formData.en?.excerpt || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          en: { ...formData.en, excerpt: e.target.value },
                        })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="A short summary (2-3 sentences)"
                      rows={3}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Content
                    </label>
                    <RichTextEditor
                      content={formData.en?.content || ''}
                      onChange={(markdown) => {
                        setFormData({
                          ...formData,
                          en: { ...formData.en, content: markdown },
                        })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Write your blog content here..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={formData.vi?.title || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, title: e.target.value },
                        })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Tiêu đề bài viết"
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tóm tắt
                    </label>
                    <textarea
                      value={formData.vi?.excerpt || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, excerpt: e.target.value },
                        })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Tóm tắt ngắn (2-3 câu)"
                      rows={3}
                      className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nội dung
                    </label>
                    <RichTextEditor
                      content={formData.vi?.content || ''}
                      onChange={(markdown) => {
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, content: markdown },
                        })
                        setHasUnsavedChanges(true)
                      }}
                      placeholder="Viết nội dung blog của bạn ở đây..."
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Featured Image</h3>
            <ImageUploader
              currentImage={formData.featuredImage}
              onUpload={(url: string) => {
                setFormData({ ...formData, featuredImage: url })
                setHasUnsavedChanges(true)
              }}
              onRemove={() => {
                setFormData({ ...formData, featuredImage: undefined })
                setHasUnsavedChanges(true)
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Featured */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Publish</h3>
            <StatusToggle
              status={formData.status}
              featured={formData.featured}
              onChange={(status: 'draft' | 'published') => {
                setFormData({ ...formData, status })
                setHasUnsavedChanges(true)
              }}
              onFeaturedChange={(featured: boolean) => {
                setFormData({ ...formData, featured })
                setHasUnsavedChanges(true)
              }}
            />
          </div>

          {/* Category */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Category</h3>
            {showNewCategory ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="New category name"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCategory} className="flex-1">
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategory(false)
                      setNewCategoryInput('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={formData.category}
                  onChange={(e) => {
                    setFormData({ ...formData, category: e.target.value })
                    setHasUnsavedChanges(true)
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewCategory(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag (press Enter)"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <Button size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Read Time */}
          {formData.readTime !== undefined && (
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">{formData.readTime} min read</span>
              </div>
            </div>
          )}

          {/* Regenerate */}
          {sourceInfo && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">AI Content</h3>
              <p className="text-sm text-slate-600 mb-4">
                This post was created from AI-polished content. You can regenerate it anytime.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={polishing}
                className="w-full"
              >
                {polishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
