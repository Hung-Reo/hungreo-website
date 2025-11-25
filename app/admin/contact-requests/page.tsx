'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Mail, ArrowLeft, Clock, CheckCircle, AlertCircle, Send, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { ContactRequest, ContactRequestStats } from '@/lib/contactRequestLogger'

interface ContactRequestsResponse {
  success: boolean
  requests: ContactRequest[]
  total: number
  stats: ContactRequestStats
  pagination: {
    limit: number
    offset: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ContactRequestsPage() {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all')

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Build query string
  const queryParams = new URLSearchParams({
    status: statusFilter,
    limit: '100',
    offset: '0',
  })

  // Fetch contact requests with SWR
  const { data, error, isLoading } = useSWR<ContactRequestsResponse>(
    `/api/admin/contact-requests?${queryParams}`,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  )

  const requests = data?.requests || []
  const stats = data?.stats || { total: 0, pending: 0, resolved: 0, todayCount: 0 }

  // Handle mark as resolved (without reply)
  const handleMarkResolved = async (id: string) => {
    try {
      const response = await fetch('/api/admin/contact-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'resolved' }),
      })

      if (!response.ok) throw new Error('Failed to update')

      mutate(`/api/admin/contact-requests?${queryParams}`)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update. Please try again.')
    }
  }

  // Handle send reply
  const handleSendReply = async () => {
    if (!selectedRequest || !replyContent.trim()) return

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/contact-requests/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          replyContent: replyContent.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reply')
      }

      // Success - close modal and refresh
      setIsReplyModalOpen(false)
      setReplyContent('')
      setSelectedRequest(null)
      mutate(`/api/admin/contact-requests?${queryParams}`)
      alert('Reply sent successfully!')
    } catch (error: any) {
      console.error('Reply error:', error)
      alert(error.message || 'Failed to send reply. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  // Open reply modal
  const openReplyModal = (request: ContactRequest) => {
    setSelectedRequest(request)
    setReplyContent('')
    setIsReplyModalOpen(true)
  }

  // Close reply modal
  const closeReplyModal = () => {
    setIsReplyModalOpen(false)
    setReplyContent('')
    setTimeout(() => setSelectedRequest(null), 300)
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Time ago
  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'vừa xong'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} phút trước`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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
        <div className="flex items-center gap-3 mb-2">
          <Mail className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold">Contact Requests</h1>
        </div>
        <p className="text-slate-600">
          Manage contact requests from chatbot users. Reply within 48 hours!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          <div className="text-sm text-slate-600">Total Requests</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-sm text-slate-600">Pending</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-slate-600">Resolved</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.todayCount}</div>
          <div className="text-sm text-slate-600">Today</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'resolved'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status === 'all' && 'All'}
            {status === 'pending' && `Pending (${stats.pending})`}
            {status === 'resolved' && 'Resolved'}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            <p className="text-slate-600">Loading contact requests...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Failed to load contact requests. Please try again.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && requests.length === 0 && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No contact requests found.</p>
        </div>
      )}

      {/* Requests List */}
      {!isLoading && !error && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className={`bg-white rounded-lg border p-6 ${
                request.status === 'pending' ? 'border-l-4 border-l-amber-500' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    {request.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Clock className="h-3 w-3" />
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Resolved
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {request.triggerType === 'fallback' ? 'Fallback' : 'Direct Request'}
                    </span>
                    <span className="text-xs text-slate-500">{timeAgo(request.createdAt)}</span>
                  </div>

                  {/* Email & Name */}
                  <div className="mb-2">
                    <a
                      href={`mailto:${request.email}`}
                      className="text-lg font-semibold text-primary-600 hover:underline"
                    >
                      {request.email}
                    </a>
                    {request.name && (
                      <span className="ml-2 text-slate-600">({request.name})</span>
                    )}
                  </div>

                  {/* Question */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-2">
                    <div className="text-xs text-slate-500 mb-1">Question:</div>
                    <p className="text-slate-700">{request.originalQuestion}</p>
                  </div>

                  {/* Admin Reply (if resolved) */}
                  {request.adminReply && (
                    <div className="bg-green-50 rounded-lg p-3 mb-2">
                      <div className="text-xs text-green-600 mb-1">Your Reply:</div>
                      <p className="text-slate-700 whitespace-pre-wrap">{request.adminReply}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Created: {formatDate(request.createdAt)}</span>
                    {request.pageContext && <span>Page: {request.pageContext}</span>}
                    {request.resolvedAt && <span>Resolved: {formatDate(request.resolvedAt)}</span>}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 md:ml-4">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => openReplyModal(request)}
                        size="sm"
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Reply
                      </Button>
                      <Button
                        onClick={() => handleMarkResolved(request.id)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Done
                      </Button>
                    </>
                  )}
                  <a
                    href={`mailto:${request.email}?subject=Re: Câu hỏi của bạn trên Hungreo&body=Chào ${request.name || 'bạn'},%0D%0A%0D%0ACảm ơn bạn đã liên hệ. Về câu hỏi: "${encodeURIComponent(request.originalQuestion)}"%0D%0A%0D%0A`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2 w-full">
                      <Mail className="h-4 w-4" />
                      Email Direct
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {isReplyModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold">Reply to {selectedRequest.name || selectedRequest.email}</h2>
              <button
                onClick={closeReplyModal}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              {/* Original Question */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-slate-500 mb-1">Original Question:</div>
                <p className="text-slate-700">{selectedRequest.originalQuestion}</p>
              </div>

              {/* Reply Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Reply:
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  disabled={isSending}
                />
              </div>

              {/* Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                User will receive a branded email from "Hưng from Hungreo". They can reply to your admin email.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t">
              <Button
                variant="outline"
                onClick={closeReplyModal}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendReply}
                disabled={isSending || !replyContent.trim()}
                className="gap-2"
              >
                {isSending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
