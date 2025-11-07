'use client'

import { useEffect, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '../ui/Button'
import type { Document, DocumentStatus } from '@/lib/documentManager'

interface DocumentStats {
  draft: number
  review: number
  approved: number
  rejected: number
  total: number
}

export function DocumentsManager() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats] = useState<DocumentStats | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<DocumentStatus | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [selectedStatus])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const url =
        selectedStatus === 'all'
          ? '/api/admin/documents'
          : `/api/admin/documents?status=${selectedStatus}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        alert(`Document uploaded successfully!\n${data.document.chunkCount} chunks created.`)
        fetchDocuments()
        // Reset file input
        e.target.value = ''
      } else {
        alert(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleStatusChange = async (docId: string, newStatus: DocumentStatus, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Document ${newStatus} successfully!`)
        fetchDocuments()
        setSelectedDoc(null)
      } else {
        alert(`Status update failed: ${data.error}`)
      }
    } catch (error) {
      alert('Status update failed. Please try again.')
    }
  }

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Document deleted successfully!')
        fetchDocuments()
        setSelectedDoc(null)
      } else {
        alert(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      alert('Delete failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Documents Management</h1>
          <Button onClick={() => signOut({ callbackUrl: '/admin/login' })} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6 border-b">
          <nav className="flex gap-6">
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Statistics
            </Link>
            <Link
              href="/admin/documents"
              className="border-b-2 border-primary-600 px-3 py-2 text-sm font-medium text-primary-600"
            >
              Documents
            </Link>
            <Link
              href="/admin/videos"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Videos
            </Link>
            <Link
              href="/admin/chats"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Chat Logs
            </Link>
          </nav>
        </div>

        {/* Upload Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Upload Document</h2>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-md file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
              />
            </label>
            {isUploading && <span className="text-sm text-slate-600">Uploading...</span>}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Supported: PDF, DOCX, TXT (Max 20MB)
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="Total"
              count={stats.total}
              color="bg-blue-50 text-blue-700"
              active={selectedStatus === 'all'}
              onClick={() => setSelectedStatus('all')}
            />
            <StatCard
              title="Draft"
              count={stats.draft}
              color="bg-gray-50 text-gray-700"
              active={selectedStatus === 'draft'}
              onClick={() => setSelectedStatus('draft')}
            />
            <StatCard
              title="Review"
              count={stats.review}
              color="bg-yellow-50 text-yellow-700"
              active={selectedStatus === 'review'}
              onClick={() => setSelectedStatus('review')}
            />
            <StatCard
              title="Approved"
              count={stats.approved}
              color="bg-green-50 text-green-700"
              active={selectedStatus === 'approved'}
              onClick={() => setSelectedStatus('approved')}
            />
            <StatCard
              title="Rejected"
              count={stats.rejected}
              color="bg-red-50 text-red-700"
              active={selectedStatus === 'rejected'}
              onClick={() => setSelectedStatus('rejected')}
            />
          </div>
        )}

        {/* Documents List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedStatus === 'all' ? 'All Documents' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} Documents`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-slate-600">Loading...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-slate-600">No documents found</span>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  onSelect={() => setSelectedDoc(doc)}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Document Detail Modal */}
        {selectedDoc && (
          <DocumentDetailModal
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  count,
  color,
  active,
  onClick,
}: {
  title: string
  count: number
  color: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-4 text-left transition-all ${color} ${active ? 'ring-2 ring-primary-500' : ''}`}
    >
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm font-medium">{title}</div>
    </button>
  )
}

function DocumentRow({
  document,
  onSelect,
  onStatusChange,
  onDelete,
}: {
  document: Document
  onSelect: () => void
  onStatusChange: (id: string, status: DocumentStatus, notes?: string) => void
  onDelete: (id: string) => void
}) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
      <div className="flex-1">
        <button onClick={onSelect} className="text-left">
          <div className="font-medium text-slate-900">{document.fileName}</div>
          <div className="mt-1 text-sm text-slate-500">
            {document.metadata.wordCount} words • {document.chunks.length} chunks •{' '}
            {(document.fileSize / 1024).toFixed(1)} KB
          </div>
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[document.status]}`}>
          {document.status}
        </span>
        {document.status === 'draft' && (
          <Button size="sm" onClick={() => onStatusChange(document.id, 'review')}>
            → Review
          </Button>
        )}
        {document.status === 'review' && (
          <>
            <Button size="sm" onClick={() => onStatusChange(document.id, 'approved')}>
              ✓ Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onStatusChange(document.id, 'rejected')}>
              ✗ Reject
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function DocumentDetailModal({
  document,
  onClose,
  onStatusChange,
  onDelete,
}: {
  document: Document
  onClose: () => void
  onStatusChange: (id: string, status: DocumentStatus, notes?: string) => void
  onDelete: (id: string) => void
}) {
  const [notes, setNotes] = useState(document.reviewNotes || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{document.fileName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Metadata */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <div className="mt-1 text-lg font-semibold text-slate-900">{document.status}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">File Type</label>
              <div className="mt-1 text-lg font-semibold text-slate-900">{document.fileType.toUpperCase()}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Word Count</label>
              <div className="mt-1 text-lg font-semibold text-slate-900">{document.metadata.wordCount}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Chunks</label>
              <div className="mt-1 text-lg font-semibold text-slate-900">{document.chunks.length}</div>
            </div>
          </div>

          {/* Extracted Text Preview */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600">Extracted Text (Preview)</label>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
              {document.extractedText.substring(0, 1000)}
              {document.extractedText.length > 1000 && '...'}
            </div>
          </div>

          {/* Review Notes */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600">Review Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
              placeholder="Add review notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={() => onDelete(document.id)} className="text-red-600">
              Delete
            </Button>
            <div className="flex gap-2">
              {document.status !== 'approved' && (
                <Button onClick={() => onStatusChange(document.id, 'approved', notes)}>
                  Approve & Add to Pinecone
                </Button>
              )}
              {document.status === 'review' && (
                <Button variant="outline" onClick={() => onStatusChange(document.id, 'rejected', notes)}>
                  Reject
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
