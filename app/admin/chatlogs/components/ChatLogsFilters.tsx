'use client'

import { useState } from 'react'
import { Search, Download, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ChatLogsFiltersProps {
  startDate: string
  endDate: string
  needsReply: string
  search: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onNeedsReplyChange: (value: string) => void
  onSearchChange: (value: string) => void
  onExport: (format: 'csv' | 'json') => void
  isExporting?: boolean
}

export function ChatLogsFilters({
  startDate,
  endDate,
  needsReply,
  search,
  onStartDateChange,
  onEndDateChange,
  onNeedsReplyChange,
  onSearchChange,
  onExport,
  isExporting = false,
}: ChatLogsFiltersProps) {
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleExport = (format: 'csv' | 'json') => {
    onExport(format)
    setShowExportMenu(false)
  }

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-1">
            <Calendar className="h-4 w-4 inline mr-1" />
            Start Date
          </label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-1">
            <Calendar className="h-4 w-4 inline mr-1" />
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Needs Reply Filter */}
        <div>
          <label htmlFor="needsReply" className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            id="needsReply"
            value={needsReply}
            onChange={(e) => onNeedsReplyChange(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="all">All Chats</option>
            <option value="true">Needs Reply</option>
            <option value="false">Replied</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">
            <Search className="h-4 w-4 inline mr-1" />
            Search
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search messages..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Quick Date Filters & Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t">
        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              onStartDateChange(today)
              onEndDateChange(today)
            }}
            className="px-3 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Today
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const sevenDaysAgo = new Date(today)
              sevenDaysAgo.setDate(today.getDate() - 7)
              onStartDateChange(sevenDaysAgo.toISOString().split('T')[0])
              onEndDateChange(today.toISOString().split('T')[0])
            }}
            className="px-3 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const thirtyDaysAgo = new Date(today)
              thirtyDaysAgo.setDate(today.getDate() - 30)
              onStartDateChange(thirtyDaysAgo.toISOString().split('T')[0])
              onEndDateChange(today.toISOString().split('T')[0])
            }}
            className="px-3 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Last 30 Days
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const ninetyDaysAgo = new Date(today)
              ninetyDaysAgo.setDate(today.getDate() - 90)
              onStartDateChange(ninetyDaysAgo.toISOString().split('T')[0])
              onEndDateChange(today.toISOString().split('T')[0])
            }}
            className="px-3 py-1 text-xs rounded-md border border-slate-300 hover:bg-slate-50"
          >
            Last 90 Days
          </button>
        </div>

        {/* Export Button */}
        <div className="relative">
          <Button
            size="sm"
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>

          {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
              <div className="py-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  )
}
