'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Save, Loader2 } from 'lucide-react'

interface AboutData {
  en: {
    name: string
    role: string
    intro: string
    photo?: string
  }
  vi: {
    name: string
    role: string
    intro: string
    photo?: string
  }
  beyondWork: {
    en: { bio: string; interests: string }
    vi: { bio: string; interests: string }
  }
}

export default function AboutEditorPage() {
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<AboutData>({
    en: { name: '', role: '', intro: '', photo: '' },
    vi: { name: '', role: '', intro: '', photo: '' },
    beyondWork: {
      en: { bio: '', interests: '' },
      vi: { bio: '', interests: '' },
    },
  })

  useEffect(() => {
    fetchAbout()
  }, [])

  async function fetchAbout() {
    try {
      const res = await fetch('/api/admin/content/about')
      if (res.ok) {
        const data = await res.json()
        setFormData(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load about content')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    // Validation
    if (!formData.en.name.trim()) {
      alert('English name is required')
      return
    }
    if (!formData.en.role.trim()) {
      alert('English role is required')
      return
    }
    if (!formData.en.intro.trim()) {
      alert('English intro is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/content/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save about content')
      }

      alert('About page saved successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save about content')
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit About Page</h1>
          <p className="text-slate-600 mt-1">Manage your personal information</p>
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
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.en.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          en: { ...formData.en, name: e.target.value },
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role *
                    </label>
                    <input
                      type="text"
                      value={formData.en.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          en: { ...formData.en, role: e.target.value },
                        })
                      }
                      placeholder="e.g., Full Stack Developer"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Photo URL
                    </label>
                    <input
                      type="text"
                      value={formData.en.photo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          en: { ...formData.en, photo: e.target.value },
                        })
                      }
                      placeholder="https://..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Introduction *
                    </label>
                    <textarea
                      value={formData.en.intro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          en: { ...formData.en, intro: e.target.value },
                        })
                      }
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Beyond Work */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Beyond Work</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.beyondWork.en.bio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          beyondWork: {
                            ...formData.beyondWork,
                            en: { ...formData.beyondWork.en, bio: e.target.value },
                          },
                        })
                      }
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Tell us about yourself outside of work..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Interests
                    </label>
                    <textarea
                      value={formData.beyondWork.en.interests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          beyondWork: {
                            ...formData.beyondWork,
                            en: { ...formData.beyondWork.en, interests: e.target.value },
                          },
                        })
                      }
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="What are your hobbies and interests?"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Info (Vietnamese) */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={formData.vi.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, name: e.target.value },
                        })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Vai trò
                    </label>
                    <input
                      type="text"
                      value={formData.vi.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, role: e.target.value },
                        })
                      }
                      placeholder="VD: Lập trình viên Full Stack"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      URL Ảnh
                    </label>
                    <input
                      type="text"
                      value={formData.vi.photo || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, photo: e.target.value },
                        })
                      }
                      placeholder="https://..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Giới thiệu
                    </label>
                    <textarea
                      value={formData.vi.intro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vi: { ...formData.vi, intro: e.target.value },
                        })
                      }
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              {/* Beyond Work (Vietnamese) */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Ngoài công việc</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tiểu sử
                    </label>
                    <textarea
                      value={formData.beyondWork.vi.bio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          beyondWork: {
                            ...formData.beyondWork,
                            vi: { ...formData.beyondWork.vi, bio: e.target.value },
                          },
                        })
                      }
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Kể về bản thân bạn ngoài công việc..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Sở thích
                    </label>
                    <textarea
                      value={formData.beyondWork.vi.interests}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          beyondWork: {
                            ...formData.beyondWork,
                            vi: { ...formData.beyondWork.vi, interests: e.target.value },
                          },
                        })
                      }
                      rows={3}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Sở thích và đam mê của bạn là gì?"
                    />
                  </div>
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
              Save About Page
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
