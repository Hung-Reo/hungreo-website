'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic import for Markdown editor (client-side only)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface ProjectData {
  id?: string
  slug: string
  status: 'draft' | 'published'
  en: { title: string; description: string; content: string }
  vi: { title: string; description: string; content: string }
  tech: string[]
  image?: string
  github?: string
  demo?: string
  featured: boolean
}

export default function ProjectEditorPage({
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

  const [formData, setFormData] = useState<ProjectData>({
    slug: '',
    status: 'draft',
    en: { title: '', description: '', content: '' },
    vi: { title: '', description: '', content: '' },
    tech: [],
    featured: false,
  })

  const [techInput, setTechInput] = useState('')

  useEffect(() => {
    if (!isNew) {
      fetchProject()
    }
  }, [params.id])

  async function fetchProject() {
    try {
      const res = await fetch(`/api/admin/content/projects/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      const data = await res.json()
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
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
        ? '/api/admin/content/projects'
        : `/api/admin/content/projects/${params.id}`

      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save project')
      }

      const { project } = await res.json()

      // Redirect to edit page if new, or stay if editing
      if (isNew) {
        router.push(`/admin/content/projects/${project.id}`)
      } else {
        alert('Project saved successfully!')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  function addTech() {
    const tech = techInput.trim()
    if (tech && !formData.tech.includes(tech)) {
      setFormData({ ...formData, tech: [...formData.tech, tech] })
      setTechInput('')
    }
  }

  function removeTech(tech: string) {
    setFormData({
      ...formData,
      tech: formData.tech.filter((t) => t !== tech),
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
          <Link href="/admin/content/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'Create Project' : 'Edit Project'}
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
              placeholder="project-slug (auto-generated from title)"
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

        {/* Tech Stack */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tech Stack
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
              placeholder="Add technology (press Enter)"
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
            />
            <Button type="button" onClick={addTech} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tech.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm"
              >
                {tech}
                <button
                  onClick={() => removeTech(tech)}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              GitHub URL
            </label>
            <input
              type="text"
              value={formData.github || ''}
              onChange={(e) =>
                setFormData({ ...formData, github: e.target.value })
              }
              placeholder="https://github.com/..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Live Demo URL
            </label>
            <input
              type="text"
              value={formData.demo || ''}
              onChange={(e) =>
                setFormData({ ...formData, demo: e.target.value })
              }
              placeholder="https://..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            />
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
              Save Project
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
