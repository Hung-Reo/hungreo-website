'use client'

import { useEffect, useState, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '../ui/Button'
import { Tooltip } from '../ui/Tooltip'
import { DocumentReviewModal } from './DocumentReviewModal'
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
  const [isDragging, setIsDragging] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [reviewDocument, setReviewDocument] = useState<(Document & {
    extractedText?: string
    chunks?: string[]
    totalChunks?: number
    costEstimate?: number
  }) | null>(null)

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

  const uploadFile = async (file: File) => {
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
        // Open review modal with the uploaded document data
        setReviewDocument({
          ...data.document,
          id: data.document.id,
          fileName: data.document.fileName,
          fileType: data.document.fileType,
          fileSize: data.document.fileSize,
          status: data.document.status as DocumentStatus,
          uploadedAt: Date.now(),
          uploadedBy: 'admin',
          extractedText: data.document.extractedText,
          chunks: data.document.chunks,
          totalChunks: data.document.totalChunks,
          costEstimate: data.document.costEstimate,
          metadata: {
            pageCount: 0,
            wordCount: data.document.wordCount,
          },
        })
      } else {
        alert(`Upload failed: ${data.error}`)
      }
    } catch (error) {
      alert('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file)
    // Reset file input
    e.target.value = ''
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
    const validTypes = ['.pdf', '.docx', '.doc', '.txt']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(fileExt)) {
      alert('Invalid file type. Please upload PDF, DOCX, or TXT files.')
      return
    }

    await uploadFile(file)
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

  const handleReviewApprove = async (docId: string, editedText?: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          extractedText: editedText,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Document approved and added to Pinecone successfully!')
        fetchDocuments()
        setReviewDocument(null)
      } else {
        alert(`Approval failed: ${data.error}`)
      }
    } catch (error) {
      alert('Approval failed. Please try again.')
    }
  }

  const handleReviewReject = async (docId: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Document rejected.')
        fetchDocuments()
        setReviewDocument(null)
      } else {
        alert(`Rejection failed: ${data.error}`)
      }
    } catch (error) {
      alert('Rejection failed. Please try again.')
    }
  }

  const handleReviewSaveDraft = async (docId: string, editedText: string) => {
    try {
      const response = await fetch(`/api/admin/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          extractedText: editedText,
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Draft saved successfully!')
        fetchDocuments()
        setReviewDocument(null)
      } else {
        alert(`Save failed: ${data.error}`)
      }
    } catch (error) {
      alert('Save failed. Please try again.')
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
              href="/admin/chatlogs"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Chat Logs
            </Link>
          </nav>
        </div>

        {/* Upload Section */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Upload Document</h2>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <div className="py-4">
                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"></div>
                <p className="text-sm font-medium text-slate-600">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-slate-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-primary-600 hover:text-primary-700">
                    Click to upload
                  </span>
                  <span className="text-sm text-slate-600"> or drag and drop</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-xs text-slate-500">PDF, DOCX, TXT up to 20MB</p>
              </>
            )}
          </div>
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

        {/* Document Review Modal */}
        {reviewDocument && (
          <DocumentReviewModal
            document={reviewDocument}
            onClose={() => setReviewDocument(null)}
            onApprove={handleReviewApprove}
            onReject={handleReviewReject}
            onSaveDraft={handleReviewSaveDraft}
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
  const tooltips: Record<string, string> = {
    Total: 'Total number of documents across all statuses',
    Draft: 'Documents uploaded but not yet submitted for review',
    Review: 'Documents pending approval or rejection',
    Approved: 'Documents approved and added to the knowledge base',
    Rejected: 'Documents that were rejected during review',
  }

  return (
    <Tooltip content={tooltips[title] || ''}>
      <button
        onClick={onClick}
        className={`w-full rounded-lg p-4 text-left transition-all ${color} ${active ? 'ring-2 ring-primary-500' : ''}`}
      >
        <div className="text-2xl font-bold">{count}</div>
        <div className="text-sm font-medium">{title}</div>
      </button>
    </Tooltip>
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
        <Tooltip content={`Status: ${document.status}`}>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[document.status]}`}>
            {document.status}
          </span>
        </Tooltip>
        {document.status === 'draft' && (
          <Tooltip content="Move this document to review queue">
            <Button size="sm" onClick={() => onStatusChange(document.id, 'review')}>
              → Review
            </Button>
          </Tooltip>
        )}
        {document.status === 'review' && (
          <>
            <Tooltip content="Approve and add to knowledge base">
              <Button size="sm" onClick={() => onStatusChange(document.id, 'approved')}>
                ✓ Approve
              </Button>
            </Tooltip>
            <Tooltip content="Reject this document">
              <Button size="sm" variant="outline" onClick={() => onStatusChange(document.id, 'rejected')}>
                ✗ Reject
              </Button>
            </Tooltip>
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
