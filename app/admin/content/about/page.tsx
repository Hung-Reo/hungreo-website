'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Save, Upload, Loader2, Eye, FileText } from 'lucide-react'
import type { AboutContent } from '@/lib/contentManager'

export default function AboutEditorPage() {
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState<AboutContent | null>(null)
  const [cvInfo, setCvInfo] = useState<any>(null)

  useEffect(() => {
    fetchAboutData()
  }, [])

  async function fetchAboutData() {
    try {
      const res = await fetch('/api/admin/content/about')
      if (res.ok) {
        const data = await res.json()
        setFormData(data)
        setCvInfo(data.cv)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load about content')
    } finally {
      setLoading(false)
    }
  }

  async function handleCVUpload(file: File) {
    setUploading(true)
    setError(null)

    try {
      console.log('Uploading CV:', file.name)

      const formData = new FormData()
      formData.append('cv', file)

      const response = await fetch('/api/admin/content/about/upload-cv', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('Upload result:', result)

      // Update form with parsed data
      setCvInfo(result.cv)
      setFormData({
        id: 'about',
        version: '1.0.0',
        updatedAt: Date.now(),
        updatedBy: 'admin',
        cv: result.cv,
        ...result.parsedData,
        embeddings: {
          generated: false,
        },
      })

      alert('✅ CV uploaded and parsed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      alert(`❌ ${errorMessage}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleCVUpload(file)
    e.target.value = '' // Reset input
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

    // Validate file type
    const validTypes = ['.pdf', '.docx']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(fileExt)) {
      alert('Invalid file type. Please upload PDF or DOCX files.')
      return
    }

    await handleCVUpload(file)
  }

  async function handleSave() {
    if (!formData) {
      alert('No data to save')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/content/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Save failed')
      }

      alert('✅ About page saved successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed'
      alert(`❌ ${errorMessage}`)
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit About Page</h1>
          <p className="text-slate-600 mt-1">Upload CV to auto-populate content</p>
        </div>
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

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Step 1: Upload CV */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Step 1: Upload CV
        </h2>

        {/* Drag & Drop Upload Area */}
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
            onChange={handleFileUpload}
            className="hidden"
            id="cv-upload"
            disabled={uploading}
          />

          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>

            <div>
              <label htmlFor="cv-upload" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-700 font-medium">
                  Click to upload
                </span>
              </label>
              <span className="text-slate-600"> or drag and drop</span>
            </div>

            <p className="text-sm text-slate-500">PDF, DOCX up to 20MB</p>
          </div>
        </div>

        {/* Current CV Info */}
        {cvInfo && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{cvInfo.fileName}</p>
              <p className="text-sm text-slate-600">
                {cvInfo.detectedLanguage === 'en' ? 'English' : 'Tiếng Việt'} •
                {' '}{new Date(cvInfo.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <p className="text-blue-700 font-medium">🤖 AI is processing your CV...</p>
            </div>
            <p className="text-blue-600 text-sm">
              Extracting text → Detecting language → Parsing structure → Translating
            </p>
            <p className="text-blue-500 text-xs mt-2">
              This may take 15-30 seconds depending on CV length
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Preview Parsed Data */}
      {formData && !uploading && (
        <div className="bg-white border rounded-lg mb-6 shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Step 2: Preview & Edit Parsed Data
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Review the AI-parsed content. You can edit it in the next phase.
            </p>
          </div>

          {/* Language Tabs */}
          <div className="border-b">
            <div className="flex px-6">
              <button
                onClick={() => setActiveTab('en')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'en'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setActiveTab('vi')}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'vi'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                Tiếng Việt
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Hero Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Hero Section
              </h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Name
                  </span>
                  <p className="text-slate-900">{formData.hero[activeTab].name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Role
                  </span>
                  <p className="text-slate-900">{formData.hero[activeTab].role}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Introduction
                  </span>
                  <p className="text-slate-900">{formData.hero[activeTab].intro}</p>
                </div>
              </div>
            </div>

            {/* Professional Journey */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Professional Journey ({formData.professionalJourney[activeTab].length}{' '}
                positions)
              </h3>
              <div className="space-y-3">
                {formData.professionalJourney[activeTab].map((job, idx) => (
                  <div key={job.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary-600">
                          {job.year}
                        </p>
                        <p className="text-base font-semibold text-slate-900 mt-1">
                          {job.title}
                        </p>
                        <p className="text-sm text-slate-600">{job.company}</p>
                        <p className="text-sm text-slate-700 mt-2">{job.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education & Expertise */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Education & Expertise
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">Education</p>
                  <div className="space-y-2">
                    {formData.educationExpertise.education[activeTab].map((edu) => (
                      <div key={edu.id} className="bg-slate-50 rounded-lg p-3">
                        <p className="font-semibold text-slate-900">{edu.degree}</p>
                        <p className="text-sm text-slate-600">{edu.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Current Focus
                  </p>
                  <div className="space-y-2">
                    {formData.educationExpertise.currentFocus[activeTab].map((focus) => (
                      <div key={focus.id} className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700">{focus.focus}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Training & Development */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Training & Development ({formData.training[activeTab].length} items)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {formData.training[activeTab].map((training) => (
                  <div key={training.id} className="bg-slate-50 rounded-lg p-3">
                    <p className="font-semibold text-slate-900">{training.name}</p>
                    <p className="text-sm text-slate-600">{training.issuer}</p>
                    {training.year && (
                      <p className="text-xs text-slate-500 mt-1">{training.year}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Core Competencies */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Core Competencies ({formData.competencies[activeTab].length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {formData.competencies[activeTab].map((comp) => (
                  <div
                    key={comp.id}
                    className="bg-slate-50 rounded-lg p-3 flex items-center gap-2"
                  >
                    <span className="text-green-600">✓</span>
                    <span className="text-sm font-medium text-slate-900">
                      {comp.competency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">Interests</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Bio
                  </span>
                  <p className="text-slate-900">{formData.interests[activeTab].bio}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    Hobbies
                  </span>
                  <p className="text-slate-900">
                    {formData.interests[activeTab].hobbies}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button at Bottom */}
      {formData && (
        <div className="flex justify-end gap-4">
          <Button onClick={() => window.open('/about', '_blank')} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview About Page
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
                Save About Page
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
