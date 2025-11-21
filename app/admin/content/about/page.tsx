'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Save, Upload, Loader2, Eye, FileText, Trash2, Plus } from 'lucide-react'
import type { AboutContent } from '@/lib/contentManager'
import { generateId } from '@/lib/contentManager'
import { toast, Toaster } from 'sonner'

export default function AboutEditorPage() {
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [formData, setFormData] = useState<AboutContent | null>(null)
  const [cvInfo, setCvInfo] = useState<any>(null)

  useEffect(() => {
    fetchAboutData()
  }, [])

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

  // Track changes to formData
  useEffect(() => {
    if (formData) {
      setHasUnsavedChanges(true)
    }
  }, [formData])

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
        let errorMessage = 'Upload failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || `Upload failed: ${response.status} ${response.statusText}`
        } catch (parseError) {
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
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

      toast.success('CV uploaded and parsed successfully!')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      setError(errorMessage)
      toast.error(errorMessage)
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
      toast.error('Invalid file type. Please upload PDF or DOCX files.')
      return
    }

    await handleCVUpload(file)
  }

  async function handleSave() {
    if (!formData) {
      toast.error('No data to save')
      return
    }

    // Validation
    if (!formData.hero.en.name || !formData.hero.en.role || !formData.hero.en.intro) {
      toast.error('Please fill in all required English fields (Name, Role, Intro)')
      return
    }

    if (!formData.hero.vi.name || !formData.hero.vi.role || !formData.hero.vi.intro) {
      toast.error('Please fill in all required Vietnamese fields (Name, Role, Intro)')
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
        // Safely parse error response
        let errorMessage = 'Save failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`
        } catch (parseError) {
          // Response is not JSON (e.g., 405 Method Not Allowed)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      toast.success('About page saved successfully!')
      setHasUnsavedChanges(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed'
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Toaster position="top-right" richColors />

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
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all data and start over? This action cannot be undone.')) {
                  setFormData(null)
                  setCvInfo(null)
                  setError(null)
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Clear all data and start over"
            >
              Clear & Start Over
            </button>
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
              Step 2: Edit Content
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Edit the AI-parsed content below. Add, edit, or delete items as needed. Don't forget to save when done!
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
              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.hero[activeTab].name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          [activeTab]: {
                            ...formData.hero[activeTab],
                            name: e.target.value
                          }
                        }
                      })
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.hero[activeTab].role}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          [activeTab]: {
                            ...formData.hero[activeTab],
                            role: e.target.value
                          }
                        }
                      })
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                    Introduction
                  </label>
                  <textarea
                    value={formData.hero[activeTab].intro}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        hero: {
                          ...formData.hero,
                          [activeTab]: {
                            ...formData.hero[activeTab],
                            intro: e.target.value
                          }
                        }
                      })
                    }}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Profile Photo Upload */}
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
                    Profile Photo
                  </label>

                  {/* Current Photo Preview */}
                  {formData.hero[activeTab].photo && (
                    <div className="mb-3">
                      <img
                        src={formData.hero[activeTab].photo}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
                      />
                    </div>
                  )}

                  {/* Upload Button */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return

                      try {
                        const uploadFormData = new FormData()
                        uploadFormData.append('photo', file)

                        const response = await fetch('/api/admin/content/about/upload-photo', {
                          method: 'POST',
                          body: uploadFormData
                        })

                        if (!response.ok) {
                          let errorMessage = 'Upload failed'
                          try {
                            const errorData = await response.json()
                            errorMessage = errorData.error || `Upload failed: ${response.status} ${response.statusText}`
                          } catch (parseError) {
                            errorMessage = `Upload failed: ${response.status} ${response.statusText}`
                          }
                          throw new Error(errorMessage)
                        }

                        const result = await response.json()

                        // Update both EN and VI with same photo URL
                        setFormData({
                          ...formData,
                          hero: {
                            en: { ...formData.hero.en, photo: result.photoUrl },
                            vi: { ...formData.hero.vi, photo: result.photoUrl }
                          }
                        })

                        toast.success('Photo uploaded successfully!')
                      } catch (err) {
                        toast.error('Photo upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
                      }

                      // Reset input
                      e.target.value = ''
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Recommended: Square image, at least 400x400px. Max 5MB.
                  </p>
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
                  <div key={job.id} className="bg-slate-50 rounded-lg p-4 relative">
                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        const newJobs = formData.professionalJourney[activeTab].filter((_, i) => i !== idx)
                        setFormData({
                          ...formData,
                          professionalJourney: {
                            ...formData.professionalJourney,
                            [activeTab]: newJobs
                          }
                        })
                      }}
                      className="absolute top-3 right-3 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete position"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-3 pr-8">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                          Year/Period
                        </label>
                        <input
                          type="text"
                          value={job.year}
                          onChange={(e) => {
                            const newJobs = [...formData.professionalJourney[activeTab]]
                            newJobs[idx] = { ...newJobs[idx], year: e.target.value }
                            setFormData({
                              ...formData,
                              professionalJourney: {
                                ...formData.professionalJourney,
                                [activeTab]: newJobs
                              }
                            })
                          }}
                          placeholder="e.g., Mar 2025 - Oct 2025"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={job.title}
                          onChange={(e) => {
                            const newJobs = [...formData.professionalJourney[activeTab]]
                            newJobs[idx] = { ...newJobs[idx], title: e.target.value }
                            setFormData({
                              ...formData,
                              professionalJourney: {
                                ...formData.professionalJourney,
                                [activeTab]: newJobs
                              }
                            })
                          }}
                          placeholder="e.g., AI Consultant"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                          Company
                        </label>
                        <input
                          type="text"
                          value={job.company}
                          onChange={(e) => {
                            const newJobs = [...formData.professionalJourney[activeTab]]
                            newJobs[idx] = { ...newJobs[idx], company: e.target.value }
                            setFormData({
                              ...formData,
                              professionalJourney: {
                                ...formData.professionalJourney,
                                [activeTab]: newJobs
                              }
                            })
                          }}
                          placeholder="e.g., Samsung Vina Electronics"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                          Description
                        </label>
                        <textarea
                          value={job.description}
                          onChange={(e) => {
                            const newJobs = [...formData.professionalJourney[activeTab]]
                            newJobs[idx] = { ...newJobs[idx], description: e.target.value }
                            setFormData({
                              ...formData,
                              professionalJourney: {
                                ...formData.professionalJourney,
                                [activeTab]: newJobs
                              }
                            })
                          }}
                          rows={3}
                          placeholder="Brief description of responsibilities and achievements"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Position Button */}
                <button
                  onClick={() => {
                    const newJob = {
                      id: generateId(),
                      year: '',
                      title: '',
                      company: '',
                      description: ''
                    }
                    setFormData({
                      ...formData,
                      professionalJourney: {
                        ...formData.professionalJourney,
                        [activeTab]: [...formData.professionalJourney[activeTab], newJob]
                      }
                    })
                  }}
                  className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Add New Position
                </button>
              </div>
            </div>

            {/* Education & Expertise */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Education & Expertise
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Education Column */}
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Education ({formData.educationExpertise.education[activeTab].length})
                  </p>
                  <div className="space-y-2">
                    {formData.educationExpertise.education[activeTab].map((edu, idx) => (
                      <div key={edu.id} className="bg-slate-50 rounded-lg p-3 relative">
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            const newEducation = formData.educationExpertise.education[activeTab].filter((_, i) => i !== idx)
                            setFormData({
                              ...formData,
                              educationExpertise: {
                                ...formData.educationExpertise,
                                education: {
                                  ...formData.educationExpertise.education,
                                  [activeTab]: newEducation
                                }
                              }
                            })
                          }}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete education"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        <div className="space-y-2 pr-6">
                          <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                              Degree
                            </label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => {
                                const newEducation = [...formData.educationExpertise.education[activeTab]]
                                newEducation[idx] = { ...newEducation[idx], degree: e.target.value }
                                setFormData({
                                  ...formData,
                                  educationExpertise: {
                                    ...formData.educationExpertise,
                                    education: {
                                      ...formData.educationExpertise.education,
                                      [activeTab]: newEducation
                                    }
                                  }
                                })
                              }}
                              placeholder="e.g., MBA"
                              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 block mb-1">
                              Detail
                            </label>
                            <input
                              type="text"
                              value={edu.detail}
                              onChange={(e) => {
                                const newEducation = [...formData.educationExpertise.education[activeTab]]
                                newEducation[idx] = { ...newEducation[idx], detail: e.target.value }
                                setFormData({
                                  ...formData,
                                  educationExpertise: {
                                    ...formData.educationExpertise,
                                    education: {
                                      ...formData.educationExpertise.education,
                                      [activeTab]: newEducation
                                    }
                                  }
                                })
                              }}
                              placeholder="e.g., University of Economics"
                              className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add New Education Button */}
                    <button
                      onClick={() => {
                        const newEdu = {
                          id: generateId(),
                          degree: '',
                          detail: ''
                        }
                        setFormData({
                          ...formData,
                          educationExpertise: {
                            ...formData.educationExpertise,
                            education: {
                              ...formData.educationExpertise.education,
                              [activeTab]: [...formData.educationExpertise.education[activeTab], newEdu]
                            }
                          }
                        })
                      }}
                      className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Add Education
                    </button>
                  </div>
                </div>

                {/* Current Focus Column */}
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-2">
                    Current Focus ({formData.educationExpertise.currentFocus[activeTab].length})
                  </p>
                  <div className="space-y-2">
                    {formData.educationExpertise.currentFocus[activeTab].map((focus, idx) => (
                      <div key={focus.id} className="bg-slate-50 rounded-lg p-3 relative">
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            const newFocus = formData.educationExpertise.currentFocus[activeTab].filter((_, i) => i !== idx)
                            setFormData({
                              ...formData,
                              educationExpertise: {
                                ...formData.educationExpertise,
                                currentFocus: {
                                  ...formData.educationExpertise.currentFocus,
                                  [activeTab]: newFocus
                                }
                              }
                            })
                          }}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete focus"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>

                        <div className="pr-6">
                          <label className="text-xs font-medium text-slate-500 block mb-1">
                            Focus Area
                          </label>
                          <input
                            type="text"
                            value={focus.focus}
                            onChange={(e) => {
                              const newFocus = [...formData.educationExpertise.currentFocus[activeTab]]
                              newFocus[idx] = { ...newFocus[idx], focus: e.target.value }
                              setFormData({
                                ...formData,
                                educationExpertise: {
                                  ...formData.educationExpertise,
                                  currentFocus: {
                                    ...formData.educationExpertise.currentFocus,
                                    [activeTab]: newFocus
                                  }
                                }
                              })
                            }}
                            placeholder="e.g., AI & Machine Learning"
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add New Focus Button */}
                    <button
                      onClick={() => {
                        const newFocus = {
                          id: generateId(),
                          focus: ''
                        }
                        setFormData({
                          ...formData,
                          educationExpertise: {
                            ...formData.educationExpertise,
                            currentFocus: {
                              ...formData.educationExpertise.currentFocus,
                              [activeTab]: [...formData.educationExpertise.currentFocus[activeTab], newFocus]
                            }
                          }
                        })
                      }}
                      className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Add Focus
                    </button>
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
                {formData.training[activeTab].map((training, idx) => (
                  <div key={training.id} className="bg-slate-50 rounded-lg p-3 relative">
                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        const newTraining = formData.training[activeTab].filter((_, i) => i !== idx)
                        setFormData({
                          ...formData,
                          training: {
                            ...formData.training,
                            [activeTab]: newTraining
                          }
                        })
                      }}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete training"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    <div className="space-y-2 pr-6">
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">
                          Training Name
                        </label>
                        <input
                          type="text"
                          value={training.name}
                          onChange={(e) => {
                            const newTraining = [...formData.training[activeTab]]
                            newTraining[idx] = { ...newTraining[idx], name: e.target.value }
                            setFormData({
                              ...formData,
                              training: {
                                ...formData.training,
                                [activeTab]: newTraining
                              }
                            })
                          }}
                          placeholder="e.g., SAP SD Module"
                          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">
                          Issuer
                        </label>
                        <input
                          type="text"
                          value={training.issuer}
                          onChange={(e) => {
                            const newTraining = [...formData.training[activeTab]]
                            newTraining[idx] = { ...newTraining[idx], issuer: e.target.value }
                            setFormData({
                              ...formData,
                              training: {
                                ...formData.training,
                                [activeTab]: newTraining
                              }
                            })
                          }}
                          placeholder="e.g., SAP Education"
                          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">
                          Year (Optional)
                        </label>
                        <input
                          type="text"
                          value={training.year || ''}
                          onChange={(e) => {
                            const newTraining = [...formData.training[activeTab]]
                            newTraining[idx] = { ...newTraining[idx], year: e.target.value }
                            setFormData({
                              ...formData,
                              training: {
                                ...formData.training,
                                [activeTab]: newTraining
                              }
                            })
                          }}
                          placeholder="e.g., 2023"
                          className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Training Button */}
                <button
                  onClick={() => {
                    const newTraining = {
                      id: generateId(),
                      name: '',
                      issuer: '',
                      year: ''
                    }
                    setFormData({
                      ...formData,
                      training: {
                        ...formData.training,
                        [activeTab]: [...formData.training[activeTab], newTraining]
                      }
                    })
                  }}
                  className="col-span-2 py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Add New Training
                </button>
              </div>
            </div>

            {/* Core Competencies */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">
                Core Competencies ({formData.competencies[activeTab].length})
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {formData.competencies[activeTab].map((comp, idx) => (
                  <div
                    key={comp.id}
                    className="bg-slate-50 rounded-lg p-2 relative"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        const newCompetencies = formData.competencies[activeTab].filter((_, i) => i !== idx)
                        setFormData({
                          ...formData,
                          competencies: {
                            ...formData.competencies,
                            [activeTab]: newCompetencies
                          }
                        })
                      }}
                      className="absolute top-1 right-1 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete competency"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    <div className="flex items-center gap-2 pr-6">
                      <span className="text-green-600 text-sm">✓</span>
                      <input
                        type="text"
                        value={comp.competency}
                        onChange={(e) => {
                          const newCompetencies = [...formData.competencies[activeTab]]
                          newCompetencies[idx] = { ...newCompetencies[idx], competency: e.target.value }
                          setFormData({
                            ...formData,
                            competencies: {
                              ...formData.competencies,
                              [activeTab]: newCompetencies
                            }
                          })
                        }}
                        placeholder="e.g., Leadership"
                        className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ))}

                {/* Add New Competency Button */}
                <button
                  onClick={() => {
                    const newComp = {
                      id: generateId(),
                      competency: ''
                    }
                    setFormData({
                      ...formData,
                      competencies: {
                        ...formData.competencies,
                        [activeTab]: [...formData.competencies[activeTab], newComp]
                      }
                    })
                  }}
                  className="col-span-3 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Add New Competency
                </button>
              </div>
            </div>

            {/* Interests */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-slate-900">Interests</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.interests[activeTab].bio}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        interests: {
                          ...formData.interests,
                          [activeTab]: {
                            ...formData.interests[activeTab],
                            bio: e.target.value
                          }
                        }
                      })
                    }}
                    rows={3}
                    placeholder="Brief personal bio"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase block mb-1">
                    Hobbies
                  </label>
                  <textarea
                    value={formData.interests[activeTab].hobbies}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        interests: {
                          ...formData.interests,
                          [activeTab]: {
                            ...formData.interests[activeTab],
                            hobbies: e.target.value
                          }
                        }
                      })
                    }}
                    rows={2}
                    placeholder="List of hobbies"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
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
