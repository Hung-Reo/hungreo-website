'use client'

import { useState, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import { MessageSquare } from 'lucide-react'
import { ChatLogsStats } from './components/ChatLogsStats'
import { ChatLogsFilters } from './components/ChatLogsFilters'
import { ChatLogsTable } from './components/ChatLogsTable'
import { ChatDetailsModal } from './components/ChatDetailsModal'
import { TopQuestions } from './components/TopQuestions'
import { ChatLogsChart } from './components/ChatLogsChart'
import type { ChatLog } from '@/lib/chatLogger'

interface ChatLogsResponse {
  success: boolean
  logs: ChatLog[]
  total: number
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ChatLogsPage() {
  // Filter states
  const [startDate, setStartDate] = useState(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return sevenDaysAgo.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [needsReply, setNeedsReply] = useState('all')
  const [search, setSearch] = useState('')

  // Modal state
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Build query string
  const queryParams = new URLSearchParams({
    startDate,
    endDate,
    ...(needsReply !== 'all' && { needsReply }),
    ...(search && { search }),
    limit: '1000', // Get all logs for client-side filtering
    offset: '0',
  })

  // Fetch chat logs with SWR
  const { data, error, isLoading } = useSWR<ChatLogsResponse>(
    `/api/admin/chatlogs?${queryParams}`,
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true,
    }
  )

  const logs = data?.logs || []

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(today.getMonth() - 1)

    return {
      totalChats: logs.length,
      chatsToday: logs.filter((log) => new Date(log.timestamp) >= today).length,
      chatsThisWeek: logs.filter((log) => new Date(log.timestamp) >= weekAgo).length,
      chatsThisMonth: logs.filter((log) => new Date(log.timestamp) >= monthAgo).length,
      needsReply: logs.filter((log) => log.needsHumanReply === true).length,
    }
  }, [logs])

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    try {
      const exportParams = new URLSearchParams({
        startDate,
        endDate,
        format,
        ...(needsReply !== 'all' && { needsReply }),
      })

      const response = await fetch(`/api/admin/chatlogs/export?${exportParams}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-logs-${startDate}-to-${endDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export chat logs. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Handle mark as replied
  const handleMarkReplied = async (chatId: string) => {
    try {
      const response = await fetch('/api/admin/chatlogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, action: 'markReplied' }),
      })

      if (!response.ok) throw new Error('Failed to mark as replied')

      // Revalidate data
      mutate(`/api/admin/chatlogs?${queryParams}`)
    } catch (error) {
      console.error('Mark replied error:', error)
      alert('Failed to mark chat as replied. Please try again.')
    }
  }

  // Handle view details
  const handleViewDetails = (log: ChatLog) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedLog(null), 300)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold">Chat Logs Dashboard</h1>
        </div>
        <p className="text-slate-600">
          View and manage all chatbot conversations. Logs are automatically deleted after 90 days.
        </p>
      </div>

      {/* Stats */}
      <ChatLogsStats stats={stats} />

      {/* Filters */}
      <ChatLogsFilters
        startDate={startDate}
        endDate={endDate}
        needsReply={needsReply}
        search={search}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onNeedsReplyChange={setNeedsReply}
        onSearchChange={setSearch}
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* Charts */}
      {!isLoading && logs.length > 0 && (
        <ChatLogsChart logs={logs} />
      )}

      {/* Top Questions */}
      {!isLoading && logs.length > 0 && (
        <TopQuestions logs={logs} limit={10} />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            <p className="text-slate-600">Loading chat logs...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">Failed to load chat logs. Please try again.</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <ChatLogsTable
          logs={logs}
          onViewDetails={handleViewDetails}
          onMarkReplied={handleMarkReplied}
        />
      )}

      {/* Details Modal */}
      <ChatDetailsModal
        log={selectedLog}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkReplied={handleMarkReplied}
      />
    </div>
  )
}
