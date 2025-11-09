'use client'

import { useState } from 'react'
import { Button } from '../ui/Button'
import type { Document } from '@/lib/documentManager'

interface DocumentReviewModalProps {
  document: Document & {
    extractedText?: string
    chunks?: string[]
    totalChunks?: number
    costEstimate?: number
  }
  onClose: () => void
  onApprove: (docId: string, editedText?: string) => void
  onReject: (docId: string) => void
  onSaveDraft: (docId: string, editedText: string) => void
}

export function DocumentReviewModal({
  document,
  onClose,
  onApprove,
  onReject,
  onSaveDraft,
}: DocumentReviewModalProps) {
  const [editedText, setEditedText] = useState(document.extractedText || '')
  const [showAllChunks, setShowAllChunks] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(document.id, editedText !== document.extractedText ? editedText : undefined)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsProcessing(true)
    try {
      await onSaveDraft(document.id, editedText)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this document?')) return

    setIsProcessing(true)
    try {
      await onReject(document.id)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-slate-50 p-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Review Document
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-200"
            disabled={isProcessing}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {/* Metadata */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                File Name
              </label>
              <p className="mt-1 text-sm text-slate-900">{document.fileName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                File Size
              </label>
              <p className="mt-1 text-sm text-slate-900">
                {(document.fileSize / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {document.pageCount && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Pages
                </label>
                <p className="mt-1 text-sm text-slate-900">{document.pageCount}</p>
              </div>
            )}
            {document.wordCount && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Words
                </label>
                <p className="mt-1 text-sm text-slate-900">
                  {document.wordCount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Extracted Text (Editable) */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Extracted Text (Editable)
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="h-64 w-full rounded-lg border border-slate-300 p-3 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="Extracted text will appear here..."
            />
            <p className="mt-1 text-xs text-slate-500">
              You can edit the extracted text before approval
            </p>
          </div>

          {/* Chunk Preview */}
          {document.chunks && document.chunks.length > 0 && (
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  📊 Chunk Preview ({document.totalChunks} chunks total)
                </label>
                {document.chunks.length < (document.totalChunks || 0) && (
                  <button
                    onClick={() => setShowAllChunks(!showAllChunks)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    {showAllChunks ? 'Show less' : 'Show all chunks'}
                  </button>
                )}
              </div>
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                {(showAllChunks ? document.chunks : document.chunks.slice(0, 3)).map((chunk, idx) => (
                  <div key={idx} className="rounded bg-white p-3 text-xs">
                    <div className="mb-1 font-semibold text-slate-600">
                      Chunk {idx + 1} (~512 tokens)
                    </div>
                    <p className="line-clamp-2 text-slate-700">{chunk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Estimate */}
          {document.costEstimate !== undefined && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <div>
                  <p className="font-semibold text-green-900">Cost Estimate</p>
                  <p className="text-sm text-green-700">
                    Approximately ${document.costEstimate.toFixed(4)} to create{' '}
                    {document.totalChunks} embedding{document.totalChunks !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 p-4">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="outline"
            disabled={isProcessing}
            className="text-red-600 hover:bg-red-50"
          >
            Reject
          </Button>
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            disabled={isProcessing}
          >
            Save Draft
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : '✅ Approve & Create Embeddings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
