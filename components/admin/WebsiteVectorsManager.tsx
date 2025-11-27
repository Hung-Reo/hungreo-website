'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { ProgressModal } from '../ui/ProgressModal'
import { useSSEProgress } from '@/hooks/useSSEProgress'

interface PageVectors {
  page: string
  vectorCount: number
  lastScraped: number
  vectorIds: string[]
}

interface VectorDetail {
  id: string
  content: string
  chunkIndex: number
  title: string
}

export function WebsiteVectorsManager() {
  const [pages, setPages] = useState<PageVectors[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReScraping, setIsReScraping] = useState(false)
  const [viewingPage, setViewingPage] = useState<PageVectors | null>(null)
  const [vectorDetails, setVectorDetails] = useState<VectorDetail[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // SSE progress tracking
  const { job, connectionState, error: streamError } = useSSEProgress({
    jobId: currentJobId,
    onComplete: () => {
      setSelectedPages(new Set())
      fetchPages()
      setCurrentJobId(null)
    },
    onError: () => {
      setCurrentJobId(null)
    },
  })

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/vectors/website')
      const data = await response.json()

      if (data.success) {
        setPages(data.pages)
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPageDetails = async (page: string) => {
    try {
      setIsLoadingDetails(true)
      const response = await fetch(`/api/admin/vectors/website?detailed=${encodeURIComponent(page)}`)
      const data = await response.json()

      if (data.success) {
        setVectorDetails(data.vectors)
      }
    } catch (error) {
      console.error('Failed to fetch page details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleViewDetails = async (page: PageVectors) => {
    setViewingPage(page)
    await fetchPageDetails(page.page)
  }

  const handleSelectAll = () => {
    if (selectedPages.size === pages.length) {
      setSelectedPages(new Set())
    } else {
      setSelectedPages(new Set(pages.map((p) => p.page)))
    }
  }

  const handleSelectPage = (page: string) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(page)) {
      newSelected.delete(page)
    } else {
      newSelected.add(page)
    }
    setSelectedPages(newSelected)
  }

  const handleDeleteSelected = async () => {
    if (selectedPages.size === 0) return

    const selectedPagesArray = Array.from(selectedPages)
    const totalVectors = pages
      .filter((p) => selectedPages.has(p.page))
      .reduce((sum, p) => sum + p.vectorCount, 0)

    if (
      !window.confirm(
        `Delete ${selectedPages.size} page(s) (${totalVectors} vectors)?\n\nPages: ${selectedPagesArray.join(', ')}\n\nThis cannot be undone.`
      )
    ) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch('/api/admin/vectors/website', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: selectedPagesArray }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully deleted ${data.deleted} vectors from ${selectedPages.size} page(s)`)
        setSelectedPages(new Set())
        await fetchPages()
      } else {
        alert(`Delete failed: ${data.error}`)
      }
    } catch (error) {
      alert('Delete failed. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReScrapeSelected = async () => {
    if (selectedPages.size === 0) return

    const selectedPagesArray = Array.from(selectedPages)

    if (
      !window.confirm(
        `Re-scrape ${selectedPages.size} page(s)?\n\nPages: ${selectedPagesArray.join(', ')}\n\nThis will delete old vectors and create new ones.`
      )
    ) {
      return
    }

    try {
      setIsReScraping(true)

      const response = await fetch('/api/admin/vectors/website/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: selectedPagesArray }),
      })

      const data = await response.json()

      if (data.success && data.jobId) {
        // Start polling for progress
        setCurrentJobId(data.jobId)
      } else if (data.success) {
        // Fallback if no jobId (shouldn't happen)
        alert(`Successfully re-scraped ${data.pagesScraped} page(s)`)
        setSelectedPages(new Set())
        await fetchPages()
      } else {
        alert(`Re-scrape failed: ${data.error}`)
      }
    } catch (error) {
      alert('Re-scrape failed. Please try again.')
      console.error('Re-scrape error:', error)
    } finally {
      setIsReScraping(false)
    }
  }

  const getPageTitle = (path: string) => {
    const titles: Record<string, string> = {
      '/': 'Home',
      '/about': 'About Me',
      '/projects': 'Projects',
      '/blog': 'Blog',
      '/contact': 'Contact',
    }
    return titles[path] || path
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

  const selectedVectorCount = pages
    .filter((p) => selectedPages.has(p.page))
    .reduce((sum, p) => sum + p.vectorCount, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Website Vectors</h1>
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

        {/* Page List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Website Pages in Vector DB
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPages}
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
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-slate-600 mb-4">No website vectors found</span>
              <Link href="/admin/dashboard">
                <Button size="sm">Go to Dashboard to Scrape Website</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="border-b px-6 py-3 bg-slate-50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPages.size === pages.length}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Select All ({pages.length} pages)
                  </span>
                </label>
              </div>

              {/* Pages List */}
              <div className="divide-y">
                {pages.map((page) => (
                  <div
                    key={page.page}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPages.has(page.page)}
                      onChange={() => handleSelectPage(page.page)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">
                        {page.page} <span className="text-slate-500">({getPageTitle(page.page)})</span>
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {page.vectorCount} vectors • Last scraped {formatTimeAgo(page.lastScraped)}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(page)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              {selectedPages.size > 0 && (
                <div className="border-t bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Selected: <strong>{selectedPages.size}</strong> page(s) (
                      <strong>{selectedVectorCount}</strong> vectors)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleReScrapeSelected}
                        disabled={isReScraping}
                      >
                        {isReScraping ? 'Re-scraping...' : 'Re-scrape Selected'}
                      </Button>
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
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {viewingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {viewingPage.page} - Vector Details
              </h2>
              <button
                onClick={() => setViewingPage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">Page</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {viewingPage.page} ({getPageTitle(viewingPage.page)})
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Vector Count</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {viewingPage.vectorCount}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Last Scraped</label>
                  <div className="mt-1 text-lg font-semibold text-slate-900">
                    {formatTimeAgo(viewingPage.lastScraped)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Timestamp</label>
                  <div className="mt-1 text-sm text-slate-600">
                    {new Date(viewingPage.lastScraped).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-slate-600">
                  Vector Chunks ({viewingPage.vectorCount})
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
                ) : (
                  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
                    No vector content found. Click "View Details" to load.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setViewingPage(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      <ProgressModal
        isOpen={Boolean(currentJobId || isReScraping)}
        status={job?.status || 'processing'}
        title="Re-scraping Website Pages"
        message={job?.progress.message || 'Starting re-scrape...'}
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
