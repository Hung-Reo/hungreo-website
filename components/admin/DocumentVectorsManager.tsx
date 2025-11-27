'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { ProgressModal } from '../ui/ProgressModal'
import { useSSEProgress } from '@/hooks/useSSEProgress'

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

interface VectorDetail {
  id: string
  content: string
  chunkIndex: number
  fileName: string
}

export function DocumentVectorsManager() {
  const [documents, setDocuments] = useState<DocumentVector[]>([])
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false)
  const [isReApproving, setIsReApproving] = useState(false)
  const [viewingDoc, setViewingDoc] = useState<DocumentVector | null>(null)
  const [vectorDetails, setVectorDetails] = useState<VectorDetail[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // SSE progress tracking
  const { job, connectionState, error: streamError } = useSSEProgress({
    jobId: currentJobId,
    onComplete: () => {
      setSelectedDocs(new Set())
      fetchDocuments()
      setCurrentJobId(null)
    },
    onError: () => {
      setCurrentJobId(null)
    },
  })

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

  const fetchDocumentDetails = async (documentId: string) => {
    try {
      setIsLoadingDetails(true)
      const response = await fetch(`/api/admin/vectors/documents?detailed=${encodeURIComponent(documentId)}`)
      const data = await response.json()

      if (data.success) {
        setVectorDetails(data.vectors)
      }
    } catch (error) {
      console.error('Failed to fetch document details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleViewDetails = async (doc: DocumentVector) => {
    setViewingDoc(doc)
    await fetchDocumentDetails(doc.id)
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

  const handleReApproveSelected = async () => {
    if (selectedDocs.size === 0) return

    const selectedDocuments = documents.filter((d) => selectedDocs.has(d.id))
    const outOfSyncDocs = selectedDocuments.filter((d) => d.status === 'out-of-sync')

    if (outOfSyncDocs.length === 0) {
      alert('No out-of-sync documents selected. Please select documents that need re-approval.')
      return
    }

    const fileNames = outOfSyncDocs.map((d) => d.fileName).join(', ')

    if (
      !window.confirm(
        `Re-approve ${outOfSyncDocs.length} document(s) to regenerate vectors?\n\nFiles: ${fileNames}\n\nThis will create new vectors in Pinecone.`
      )
    ) {
      return
    }

    try {
      setIsReApproving(true)

      // For single document, use SSE
      if (outOfSyncDocs.length === 1) {
        const doc = outOfSyncDocs[0]
        const response = await fetch('/api/admin/documents/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: doc.id }),
        })

        const data = await response.json()

        if (data.success && data.jobId) {
          // Start SSE tracking
          setCurrentJobId(data.jobId)
        } else if (data.success) {
          // Fallback if no jobId
          alert(`Successfully re-approved ${doc.fileName}`)
          setSelectedDocs(new Set())
          await fetchDocuments()
        } else {
          alert(`Re-approval failed: ${data.error}`)
        }
      } else {
        // For multiple documents, process sequentially (no SSE UI for now)
        let successCount = 0
        let errorCount = 0
        const errors: string[] = []

        for (const doc of outOfSyncDocs) {
          try {
            const response = await fetch('/api/admin/documents/approve', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ documentId: doc.id }),
            })

            const data = await response.json()

            if (data.success) {
              successCount++
            } else {
              errorCount++
              errors.push(`${doc.fileName}: ${data.error}`)
            }
          } catch (error: any) {
            errorCount++
            errors.push(`${doc.fileName}: ${error.message}`)
          }
        }

        if (successCount > 0) {
          const message = `Successfully re-approved ${successCount} document(s).${
            errorCount > 0 ? `\n\nFailed: ${errorCount} document(s)\n${errors.join('\n')}` : ''
          }`
          alert(message)
          setSelectedDocs(new Set())
          await fetchDocuments()
        } else {
          alert(`Re-approval failed for all documents:\n\n${errors.join('\n')}`)
        }
      }
    } catch (error) {
      alert('Re-approval failed. Please try again.')
    } finally {
      setIsReApproving(false)
    }
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
          `Successfully deleted ${data.deleted} vectors from ${selectedDocs.size} document(s).\n\nTo re-add vectors, use the "Re-Approve Selected" button or go to Documents page.`
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

  const handleDeleteDocuments = async () => {
    if (selectedDocs.size === 0) return

    const selectedDocsArray = Array.from(selectedDocs)
    const selectedDocuments = documents.filter((d) => selectedDocs.has(d.id))
    const totalVectors = selectedDocuments.reduce((sum, d) => sum + d.vectorCount, 0)

    const fileNames = selectedDocuments.map((d) => d.fileName).join(', ')

    if (
      !window.confirm(
        `⚠️ PERMANENTLY DELETE ${selectedDocs.size} document(s) from the system?\n\nFiles: ${fileNames}\n\nThis will delete:\n• ${totalVectors} vectors from Pinecone\n• All document data and files\n\n⚠️ THIS CANNOT BE UNDONE!`
      )
    ) {
      return
    }

    try {
      setIsDeletingDocuments(true)

      // Call the DELETE API for each document
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      for (const doc of selectedDocuments) {
        try {
          const response = await fetch(`/api/admin/documents/${doc.id}`, {
            method: 'DELETE',
          })

          const data = await response.json()

          if (data.success) {
            successCount++
          } else {
            errorCount++
            errors.push(`${doc.fileName}: ${data.error}`)
          }
        } catch (error: any) {
          errorCount++
          errors.push(`${doc.fileName}: ${error.message}`)
        }
      }

      if (successCount > 0) {
        const message = `Successfully deleted ${successCount} document(s) from the system.${
          errorCount > 0 ? `\n\nFailed: ${errorCount} document(s)\n${errors.join('\n')}` : ''
        }`
        alert(message)
        setSelectedDocs(new Set())
        await fetchDocuments()
      } else {
        alert(`Deletion failed for all documents:\n\n${errors.join('\n')}`)
      }
    } catch (error) {
      alert('Document deletion failed. Please try again.')
    } finally {
      setIsDeletingDocuments(false)
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

  const selectedOutOfSyncCount = documents
    .filter((d) => selectedDocs.has(d.id) && d.status === 'out-of-sync')
    .length

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
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(doc)}>
                      View Details
                    </Button>
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
                      {selectedOutOfSyncCount > 0 && (
                        <span className="ml-2 text-yellow-600">
                          • {selectedOutOfSyncCount} out-of-sync
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedOutOfSyncCount > 0 && (
                        <Button
                          variant="outline"
                          onClick={handleReApproveSelected}
                          disabled={isReApproving}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          {isReApproving ? 'Re-Approving...' : 'Re-Approve Selected'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
                        className="text-orange-600 hover:bg-orange-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Vectors Only'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleDeleteDocuments}
                        disabled={isDeletingDocuments}
                        className="text-red-600 hover:bg-red-50 font-semibold"
                      >
                        {isDeletingDocuments ? 'Deleting...' : 'Delete Document(s)'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {viewingDoc.fileName} - Vector Details
              </h2>
              <button
                onClick={() => setViewingDoc(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">File Name</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {viewingDoc.fileName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">File Type</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {viewingDoc.fileType.toUpperCase()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">File Size</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatFileSize(viewingDoc.fileSize)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Word Count</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {viewingDoc.wordCount}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Vectors in Pinecone</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {viewingDoc.vectorCount} / {viewingDoc.expectedVectors}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Sync Status</label>
                  <div className="mt-1">
                    {viewingDoc.status === 'synced' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-sm font-medium text-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        Out of sync
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Uploaded</label>
                  <div className="mt-1 text-sm text-slate-600">
                    {formatTimeAgo(viewingDoc.uploadedAt)} ({new Date(viewingDoc.uploadedAt).toLocaleString()})
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Uploaded By</label>
                  <div className="mt-1 text-sm text-slate-600">{viewingDoc.uploadedBy}</div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-slate-600">
                  Vector Chunks ({viewingDoc.vectorCount})
                </label>
                {isLoadingDetails ? (
                  <div className="mt-2 flex items-center justify-center rounded-lg border bg-slate-50 p-8">
                    <span className="text-slate-600">Loading chunk content...</span>
                  </div>
                ) : vectorDetails.length > 0 ? (
                  <div className="mt-2 max-h-96 overflow-y-auto rounded-lg border bg-slate-50 p-4">
                    <div className="space-y-4">
                      {vectorDetails.map((vector, index) => (
                        <div key={vector.id} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">
                              Chunk {vector.chunkIndex + 1}
                            </div>
                            <div className="font-mono text-xs text-slate-500">{vector.id}</div>
                          </div>
                          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {vector.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : viewingDoc.pineconeIds.length === 0 ? (
                  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                    No Pinecone IDs stored. This document may need to be re-approved to generate vectors.
                  </div>
                ) : (
                  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                    No vector content found. Click "View Details" to load.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setViewingDoc(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={Boolean(currentJobId || isReApproving)}
        status={job?.status || 'processing'}
        title="Re-approving Document"
        message={job?.progress.message || 'Starting document re-approval...'}
        progress={job?.progress}
        error={(job?.status === 'failed' && job?.error) || streamError || undefined}
        logs={job?.logs}
        connectionState={connectionState}
        onClose={() => {
          setCurrentJobId(null)
        }}
      />
    </div>
  )
}
