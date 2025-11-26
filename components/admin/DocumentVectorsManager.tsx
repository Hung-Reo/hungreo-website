'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'

interface DocumentVector {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: number
  uploadedBy: string
  wordCount: number
  vectorCount: number
  expectedVectors: number
  pineconeIds: string[]
  status: 'synced' | 'out-of-sync'
}

export function DocumentVectorsManager() {
  const [documents, setDocuments] = useState<DocumentVector[]>([])
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/vectors/documents')
      const data = await response.json()

      if (data.success) {
        setDocuments(data.documents)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedDocs.size === documents.length) {
      setSelectedDocs(new Set())
    } else {
      setSelectedDocs(new Set(documents.map((d) => d.id)))
    }
  }

  const handleSelectDoc = (id: string) => {
    const newSelected = new Set(selectedDocs)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedDocs(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedDocs.size === 0) return

    const selectedDocsArray = Array.from(selectedDocs)
    const totalVectors = documents
      .filter((d) => selectedDocs.has(d.id))
      .reduce((sum, d) => sum + d.vectorCount, 0)

    const fileNames = documents
      .filter((d) => selectedDocs.has(d.id))
      .map((d) => d.fileName)
      .join(', ')

    if (
      !window.confirm(
        `Delete vectors for ${selectedDocs.size} document(s) (${totalVectors} vectors)?\n\nFiles: ${fileNames}\n\nNote: This only deletes vectors from Pinecone, not the documents themselves.\n\nThis cannot be undone.`
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch('/api/admin/vectors/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: selectedDocsArray }),
      })

      const data = await response.json()

      if (data.success) {
        alert(
          `Successfully deleted ${data.deleted} vectors from ${selectedDocs.size} document(s).\n\nTo re-add vectors, go to Documents page and re-approve the documents.`
        )
        setSelectedDocs(new Set())
        await fetchDocuments()
      } else {
        alert(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      alert('Delete failed. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const selectedVectorCount = documents
    .filter((d) => selectedDocs.has(d.id))
    .reduce((sum, d) => sum + d.vectorCount, 0)

  const syncedCount = documents.filter((d) => d.status === 'synced').length
  const outOfSyncCount = documents.filter((d) => d.status === 'out-of-sync').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Document Vectors</h1>
          <Button onClick={() => signOut({ callbackUrl: '/admin/login' })} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Back to Vectors */}
        <div className="mb-6">
          <Link href="/admin/vectors">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Vector Overview
            </Button>
          </Link>
        </div>

        {/* Stats */}
        {documents.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-sm font-medium text-green-900">Synced</div>
              </div>
              <div className="mt-1 text-2xl font-bold text-green-900">{syncedCount}</div>
              <div className="text-xs text-green-700">All vectors present in Pinecone</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="text-sm font-medium text-yellow-900">Out of Sync</div>
              </div>
              <div className="mt-1 text-2xl font-bold text-yellow-900">{outOfSyncCount}</div>
              <div className="text-xs text-yellow-700">Vector count mismatch</div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Approved Documents in Vector DB
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDocuments}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-slate-600">Loading...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-slate-600 mb-4">No approved documents with vectors found</span>
              <Link href="/admin/documents">
                <Button size="sm">Go to Documents to Upload & Approve</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="border-b px-6 py-3 bg-slate-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDocs.size === documents.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Select All ({documents.length} documents)
                  </span>
                </label>
              </div>

              {/* Documents List */}
              <div className="divide-y">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.has(doc.id)}
                      onChange={() => handleSelectDoc(doc.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-slate-900">{doc.fileName}</div>
                        {doc.status === 'out-of-sync' && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                            Out of sync
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {formatFileSize(doc.fileSize)} • {doc.wordCount} words • {doc.vectorCount}/
                        {doc.expectedVectors} vectors • Uploaded {formatTimeAgo(doc.uploadedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {selectedDocs.size > 0 && (
                <div className="border-t bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Selected: <strong>{selectedDocs.size}</strong> document(s) (
                      <strong>{selectedVectorCount}</strong> vectors)
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDeleteSelected}
                      disabled={isDeleting}
                      className="text-red-600 hover:bg-red-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Selected Vectors'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
