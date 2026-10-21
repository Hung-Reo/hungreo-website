'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { BilingualTabs } from '@/components/admin/BilingualTabs'
import { HOME_NOW_LIMITS, type HomeNowContent, type HomeNowText } from '@/lib/homeNow'

const FIELDS: Array<{ key: keyof HomeNowText; label: { en: string; vi: string }; rows: number; required: boolean }> = [
  { key: 'updated', label: { en: 'Date line *', vi: 'Dòng ngày cập nhật *' }, rows: 1, required: true },
  { key: 'buildingP1', label: { en: 'Building now — paragraph 1 *', vi: 'Đang xây — đoạn 1 *' }, rows: 4, required: true },
  { key: 'buildingP2', label: { en: 'Building now — paragraph 2 (optional)', vi: 'Đang xây — đoạn 2 (để trống sẽ ẩn)' }, rows: 3, required: false },
  { key: 'learningP1', label: { en: 'Learning now — paragraph 1 *', vi: 'Đang học — đoạn 1 *' }, rows: 4, required: true },
  { key: 'learningP2', label: { en: 'Learning now — paragraph 2 (optional)', vi: 'Đang học — đoạn 2 (để trống sẽ ẩn)' }, rows: 3, required: false },
]

export default function HomeNowEditorPage() {
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('vi')
  const [content, setContent] = useState<HomeNowContent | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/content/home')
        const data = await res.json().catch(() => null)
        if (!res.ok || !data?.content) throw new Error(data?.error || `Failed to load (HTTP ${res.status})`)
        setContent(data.content)
        setIsDefault(Boolean(data.isDefault))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  function updateField(key: keyof HomeNowText, value: string) {
    setContent((prev) => prev && { ...prev, [activeTab]: { ...prev[activeTab], [key]: value } })
    setHasUnsavedChanges(true)
  }

  async function handleSave() {
    if (!content) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/content/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || `Save failed (HTTP ${res.status})`)
      setContent(data.content)
      setIsDefault(false)
      setHasUnsavedChanges(false)
      toast.success('Saved. The homepage shows the new text on the next load.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
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

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error || 'Failed to load'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Home Page</h1>
            <p className="text-sm text-slate-600 mt-1">
              Khối &quot;Đang xây / Đang học&quot; trên trang chủ. Tiêu đề và link giữ nguyên.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {isDefault && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Đang hiện nội dung mặc định (bản tháng 10/2026). Sửa rồi bấm Save để lưu bản đầu tiên.
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <BilingualTabs activeTab={activeTab} onChange={setActiveTab} />
        <div className="p-6 space-y-6">
          {FIELDS.map(({ key, label, rows }) => {
            const value = content[activeTab][key]
            const max = key === 'updated' ? HOME_NOW_LIMITS.updated : HOME_NOW_LIMITS.paragraph
            return (
              <div key={key}>
                <div className="mb-2 flex items-baseline justify-between">
                  <label className="block text-sm font-medium text-slate-700">{label[activeTab]}</label>
                  <span className={`text-xs ${value.length > max ? 'text-red-600' : 'text-slate-400'}`}>
                    {value.length}/{max}
                  </span>
                </div>
                {rows === 1 ? (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <textarea
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                    rows={rows}
                    className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
