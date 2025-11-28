'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  Save,
  Upload,
  Loader2,
  Eye,
  FileText,
  ArrowLeft,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { BilingualTabs } from '@/components/admin/BilingualTabs'
import RichTextEditor from '@/components/admin/RichTextEditor'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { StatusToggle } from '@/components/admin/StatusToggle'
import type { Project } from '@/lib/contentManager'
import { generateSlug } from '@/lib/utils'

export default function ProjectEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === 'new'

  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')
  const [loading, setLoading] = useState(!isNew)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [formData, setFormData] = useState<Partial<Project> | null>(null)
  const [sourceInfo, setSourceInfo] = useState<any>(null)

  // Tech stack & learnings input states
  const [techInput, setTechInput] = useState('')
  const [learningInput, setLearningInput] = useState('')

  useEffect(() => {
    if (!isNew) {
      fetchProject()
    } else {
      // Initialize empty form for new project
      setFormData({
        status: 'draft',
        featured: false,
        en: { title: '', description: '', content: '' },
        vi: { title: '', description: '', content: '' },
        techStack: [],
        learnings: [],
        screenshots: [],
      })
    }
  }, [params.id])

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

  useEffect(() => {
    if (formData) {
      setHasUnsavedChanges(true)
    }
  }, [formData])

  async function fetchProject() {
    try {
      const res = await fetch(`/api/admin/content/projects/${params.id}`)
      if (!res.ok) throw new Error('Project not found')
      const data = await res.json()
      setFormData(data.project || data)
      setSourceInfo(data.project?.source || data.source)
    } catch (error) {
      toast.error('Failed to load project')
      router.push('/admin/content/projects')
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(file: File) {
    setUploading(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/content/projects/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      // Update form with parsed data
      setSourceInfo(result.source)
      setFormData({
        status: 'draft',
        featured: false,
        en: {
          title: result.parsedData.en.title,
          description: result.parsedData.en.description,
          content: result.parsedData.en.content,
        },
        vi: {
          title: result.parsedData.vi.title,
          description: result.parsedData.vi.description,
          content: result.parsedData.vi.content,
        },
        techStack: result.parsedData.en.techStack || [],
        learnings: result.parsedData.en.learnings || [],
        screenshots: [],
        source: result.source,
      })

      toast.success('Document uploaded and parsed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const validTypes = ['.pdf', '.docx']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(fileExt)) {
      toast.error('Invalid file type. Please upload PDF or DOCX files.')
      return
    }

    await handleFileUpload(file)
  }

  async function handleRegenerate() {
    if (!sourceInfo?.rawContent) {
      toast.error('No source content available for regeneration')
      return
    }

    setRegenerating(true)

    try {
      const response = await fetch('/api/admin/content/projects/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawContent: sourceInfo.rawContent }),
      })

      if (!response.ok) {
        throw new Error('Regeneration failed')
      }

      const result = await response.json()

      // Update form with regenerated data
      setFormData({
        ...formData,
        en: {
          title: result.parsedData.en.title,
          description: result.parsedData.en.description,
          content: result.parsedData.en.content,
        },
        vi: {
          title: result.parsedData.vi.title,
          description: result.parsedData.vi.description,
          content: result.parsedData.vi.content,
        },
        techStack: result.parsedData.en.techStack || [],
        learnings: result.parsedData.en.learnings || [],
      })

      toast.success('Content regenerated successfully!')
    } catch (error) {
      toast.error('Failed to regenerate content')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleSave() {
    if (!formData) return

    // Validation
    if (!formData.en?.title || !formData.en?.description) {
      toast.error('Please fill in English title and description')
      return
    }

    if (!formData.vi?.title || !formData.vi?.description) {
      toast.error('Please fill in Vietnamese title and description')
      return
    }

    setSaving(true)

    try {
      const url = isNew
        ? '/api/admin/content/projects'
        : `/api/admin/content/projects/${params.id}`

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = 'Save failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      toast.success('Project saved successfully!')
      setHasUnsavedChanges(false)

      if (isNew && result.project) {
        router.push(`/admin/content/projects/${result.project.id}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      toast.error(errorMessage)
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  function addTechStack() {
    if (!techInput.trim() || !formData) return
    setFormData({
      ...formData,
      techStack: [...(formData.techStack || []), techInput.trim()],
    })
    setTechInput('')
  }

  function removeTechStack(index: number) {
    if (!formData) return
    setFormData({
      ...formData,
      techStack: formData.techStack?.filter((_, i) => i !== index),
    })
  }

  function addLearning() {
    if (!learningInput.trim() || !formData) return
    setFormData({
      ...formData,
      learnings: [...(formData.learnings || []), learningInput.trim()],
    })
    setLearningInput('')
  }

  function removeLearning(index: number) {
    if (!formData) return
    setFormData({
      ...formData,
      learnings: formData.learnings?.filter((_, i) => i !== index),
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/content/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isNew ? 'Create Project' : 'Edit Project'}
            </h1>
            <p className="text-slate-600 mt-1">
              {isNew ? 'Upload document or create manually' : 'Edit project details'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {formData?.slug && formData?.status === 'published' && (
            <Button variant="outline" onClick={() => window.open(`/projects/${formData.slug}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !formData}>
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

      {/* Step 1: Upload Document (only for new projects or if no data) */}
      {isNew && !formData?.en?.title && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Step 1: Upload Project Document (Optional)
          </h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 hover:border-slate-400'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
                e.target.value = ''
              }}
              className="hidden"
              id="project-upload"
              disabled={uploading}
            />

            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>

              <div>
                <label htmlFor="project-upload" className="cursor-pointer">
                  <span className="text-primary-600 hover:text-primary-700 font-medium">
                    Click to upload
                  </span>
                </label>
                <span className="text-slate-600"> or drag and drop</span>
              </div>

              <p className="text-sm text-slate-500">PDF, DOCX up to 10MB</p>
              <p className="text-xs text-slate-400">
                Or skip this step and create project manually below
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <p className="text-blue-700 font-medium">AI is processing your document...</p>
              </div>
              <p className="text-blue-600 text-sm">
                Extracting text → Detecting language → Parsing structure → Generating bilingual
                content
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Edit Content */}
      {formData && (
        <div className="bg-white border rounded-lg mb-6 shadow-sm">
          <div className="border-b p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {isNew ? 'Step 2: Edit Content' : 'Edit Content'}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Edit project details below. Don't forget to save!
                </p>
              </div>
              {sourceInfo?.rawContent && (
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  size="sm"
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate with AI
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Status & Featured */}
          <div className="p-6 border-b">
            <StatusToggle
              status={formData.status || 'draft'}
              onChange={(status) => setFormData({ ...formData, status })}
              featured={formData.featured}
              onFeaturedChange={(featured) => setFormData({ ...formData, featured })}
            />
          </div>

          {/* Language Tabs */}
          <BilingualTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={formData[activeTab]?.title || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [activeTab]: {
                      ...formData[activeTab],
                      title: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Enter project title"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Short Description *
              </label>
              <textarea
                value={formData[activeTab]?.description || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [activeTab]: {
                      ...formData[activeTab],
                      description: e.target.value,
                    },
                  })
                }
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Brief project description (1-2 sentences)"
              />
            </div>

            {/* Content (Markdown) */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Detailed Content
              </label>
              <RichTextEditor
                content={formData[activeTab]?.content || ''}
                onChange={(html) =>
                  setFormData({
                    ...formData,
                    [activeTab]: {
                      ...formData[activeTab],
                      content: html,
                    },
                  })
                }
                placeholder="Write your project details here..."
              />
            </div>
          </div>

          {/* Tech Stack (language-independent) */}
          <div className="p-6 border-t">
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Tech Stack
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTechStack()
                  }
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Add technology (e.g., Next.js, TypeScript)"
              />
              <Button onClick={addTechStack} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.techStack?.map((tech, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                >
                  {tech}
                  <button
                    onClick={() => removeTechStack(index)}
                    className="hover:text-blue-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Key Learnings */}
          <div className="p-6 border-t">
            <label className="text-sm font-medium text-slate-700 block mb-2">
              Key Learnings
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Learnings will be displayed in both English and Vietnamese
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={learningInput}
                onChange={(e) => setLearningInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addLearning()
                  }
                }}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="Add a key learning or takeaway"
              />
              <Button onClick={addLearning} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {(formData.learnings || []).map((learning, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg flex items-start justify-between gap-2"
                >
                  <p className="text-sm text-slate-700 flex-1">{learning}</p>
                  <button
                    onClick={() => removeLearning(index)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="p-6 border-t grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                GitHub URL (Optional)
              </label>
              <input
                type="url"
                value={formData.githubUrl || ''}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Demo URL (Optional)
              </label>
              <input
                type="url"
                value={formData.demoUrl || ''}
                onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Images */}
          <div className="p-6 border-t space-y-6">
            {/* Featured Image */}
            <ImageUploader
              label="Featured Image"
              currentImage={formData.featuredImage}
              onUpload={(url) => setFormData({ ...formData, featuredImage: url })}
              onRemove={() => setFormData({ ...formData, featuredImage: undefined })}
            />

            {/* Screenshots */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Screenshots (Max 5)
              </label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {formData.screenshots?.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border-2 border-slate-200"
                    />
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          screenshots: formData.screenshots?.filter((_, i) => i !== index),
                        })
                      }
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {(!formData.screenshots || formData.screenshots.length < 5) && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    try {
                      const uploadFormData = new FormData()
                      uploadFormData.append('image', file)

                      const response = await fetch('/api/admin/upload/image', {
                        method: 'POST',
                        body: uploadFormData,
                      })

                      if (!response.ok) throw new Error('Upload failed')

                      const { url } = await response.json()
                      setFormData({
                        ...formData,
                        screenshots: [...(formData.screenshots || []), url],
                      })
                      toast.success('Screenshot uploaded')
                    } catch (error) {
                      toast.error('Failed to upload screenshot')
                    }

                    e.target.value = ''
                  }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              )}
              <p className="text-xs text-slate-500 mt-2">
                Upload up to 5 project screenshots
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Button at Bottom */}
      {formData && (
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => router.push('/admin/content/projects')}>
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
                {formData.status === 'published' ? 'Save & Publish' : 'Save Draft'}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
