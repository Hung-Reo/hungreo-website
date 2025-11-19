'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import type { ContactMethod } from '@/lib/contentManager'
import {
  Loader2,
  Mail,
  Phone,
  Linkedin,
  Github,
  Twitter,
  Globe,
  MapPin,
  Link as LinkIcon,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const CONTACT_TYPES = [
  { value: 'email', icon: Mail, label: 'Email', placeholder: 'email@example.com' },
  { value: 'phone', icon: Phone, label: 'Phone', placeholder: '+84 123 456 789' },
  { value: 'linkedin', icon: Linkedin, label: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { value: 'github', icon: Github, label: 'GitHub', placeholder: 'https://github.com/...' },
  { value: 'twitter', icon: Twitter, label: 'Twitter', placeholder: 'https://twitter.com/...' },
  { value: 'website', icon: Globe, label: 'Website', placeholder: 'https://example.com' },
  { value: 'address', icon: MapPin, label: 'Address', placeholder: '123 Street, City' },
  { value: 'custom', icon: LinkIcon, label: 'Custom', placeholder: 'Custom value' },
] as const

export default function AdminContactPage() {
  const router = useRouter()
  const [methods, setMethods] = useState<ContactMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state for add/edit
  const [formData, setFormData] = useState({
    type: 'email' as ContactMethod['type'],
    labelEn: '',
    labelVi: '',
    value: '',
    visible: true,
  })

  useEffect(() => {
    fetchMethods()
  }, [])

  async function fetchMethods() {
    try {
      const res = await fetch('/api/admin/content/contact')
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setMethods(data.methods || [])
    } catch (error) {
      console.error('Failed to fetch contact methods:', error)
      toast.error('Failed to load contact methods')
    } finally {
      setLoading(false)
    }
  }

  async function saveToDatabase(updatedMethods: ContactMethod[]) {
    try {
      const res = await fetch('/api/admin/content/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods: updatedMethods }),
      })

      if (!res.ok) throw new Error('Failed to save')
      return true
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Failed to save changes')
      return false
    }
  }

  async function handleAddNew() {
    if (!formData.labelEn || !formData.labelVi || !formData.value) {
      toast.error('Please fill all fields')
      return
    }

    const typeConfig = CONTACT_TYPES.find((t) => t.value === formData.type)!
    const newMethod: ContactMethod = {
      id: `contact-${Date.now()}`,
      type: formData.type,
      label: {
        en: formData.labelEn,
        vi: formData.labelVi,
      },
      value: formData.value,
      icon: typeConfig.icon.name,
      order: methods.length,
      visible: formData.visible,
    }

    const updatedMethods = [...methods, newMethod]
    const saved = await saveToDatabase(updatedMethods)

    if (saved) {
      setMethods(updatedMethods)
      setShowAddForm(false)
      resetForm()
      toast.success('Contact method added')
    }
  }

  function handleEdit(method: ContactMethod) {
    setEditingId(method.id)
    setFormData({
      type: method.type,
      labelEn: method.label.en,
      labelVi: method.label.vi,
      value: method.value,
      visible: method.visible,
    })
  }

  async function handleSaveEdit() {
    if (!editingId) return

    const updatedMethods = methods.map((m) =>
      m.id === editingId
        ? {
            ...m,
            type: formData.type,
            label: { en: formData.labelEn, vi: formData.labelVi },
            value: formData.value,
            visible: formData.visible,
            icon: CONTACT_TYPES.find((t) => t.value === formData.type)!.icon.name,
          }
        : m
    )

    const saved = await saveToDatabase(updatedMethods)

    if (saved) {
      setMethods(updatedMethods)
      setEditingId(null)
      resetForm()
      toast.success('Contact method updated')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this contact method?')) return

    const updatedMethods = methods.filter((m) => m.id !== id).map((m, i) => ({ ...m, order: i }))
    const saved = await saveToDatabase(updatedMethods)

    if (saved) {
      setMethods(updatedMethods)
      toast.success('Contact method deleted')
    }
  }

  async function handleMoveUp(index: number) {
    if (index === 0) return

    const newMethods = [...methods]
    ;[newMethods[index - 1], newMethods[index]] = [newMethods[index], newMethods[index - 1]]
    const updatedMethods = newMethods.map((m, i) => ({ ...m, order: i }))

    const saved = await saveToDatabase(updatedMethods)
    if (saved) {
      setMethods(updatedMethods)
    }
  }

  async function handleMoveDown(index: number) {
    if (index === methods.length - 1) return

    const newMethods = [...methods]
    ;[newMethods[index], newMethods[index + 1]] = [newMethods[index + 1], newMethods[index]]
    const updatedMethods = newMethods.map((m, i) => ({ ...m, order: i }))

    const saved = await saveToDatabase(updatedMethods)
    if (saved) {
      setMethods(updatedMethods)
    }
  }

  async function toggleVisibility(id: string) {
    const updatedMethods = methods.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m))
    const saved = await saveToDatabase(updatedMethods)

    if (saved) {
      setMethods(updatedMethods)
    }
  }

  function resetForm() {
    setFormData({
      type: 'email',
      labelEn: '',
      labelVi: '',
      value: '',
      visible: true,
    })
  }

  function getIconComponent(type: ContactMethod['type']) {
    return CONTACT_TYPES.find((t) => t.value === type)?.icon || LinkIcon
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const typeConfig = CONTACT_TYPES.find((t) => t.value === formData.type)!

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Contact Information</h1>
          <p className="text-slate-600 mt-2">
            Manage your contact methods shown on the public contact page. Changes are saved automatically.
          </p>
        </div>

        {/* Add Button */}
        {!showAddForm && !editingId && (
          <div className="mb-6">
            <Button onClick={() => setShowAddForm(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact Method
            </Button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <div className="mb-6 p-6 bg-white rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Contact Method' : 'Add New Contact Method'}
            </h3>

            <div className="space-y-4">
              {/* Type Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CONTACT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Labels */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Label (English)
                  </label>
                  <input
                    type="text"
                    value={formData.labelEn}
                    onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                    placeholder={`${typeConfig.label} EN`}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Label (Vietnamese)
                  </label>
                  <input
                    type="text"
                    value={formData.labelVi}
                    onChange={(e) => setFormData({ ...formData, labelVi: e.target.value })}
                    placeholder={`${typeConfig.label} VI`}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Value</label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={typeConfig.placeholder}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Visible Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formData.visible}
                  onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="visible" className="text-sm text-slate-700">
                  Visible on public page
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={editingId ? handleSaveEdit : handleAddNew}>
                  {editingId ? 'Save Changes' : 'Add Method'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingId(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Methods List */}
        <div className="space-y-4">
          {methods.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-600">No contact methods yet. Add your first one above!</p>
            </div>
          ) : (
            methods.map((method, index) => {
              const Icon = getIconComponent(method.type)

              return (
                <div
                  key={method.id}
                  className="p-4 bg-white rounded-lg border flex items-start gap-4"
                >
                  {/* Icon & Number */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500 w-6">{index + 1}.</span>
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{method.label.en}</h3>
                      <span className="text-xs text-slate-500">|</span>
                      <span className="text-sm text-slate-600">{method.label.vi}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-1">{method.value}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        {CONTACT_TYPES.find((t) => t.value === method.type)?.label}
                      </span>
                      {method.visible ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          Visible
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => toggleVisibility(method.id)}
                      className="p-2 hover:bg-slate-100 rounded"
                      title={method.visible ? 'Hide' : 'Show'}
                    >
                      {method.visible ? (
                        <Eye className="h-4 w-4 text-slate-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    {/* Move Up */}
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4 text-slate-600" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === methods.length - 1}
                      className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4 text-slate-600" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEdit(method)}
                      className="p-2 hover:bg-slate-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="p-2 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
