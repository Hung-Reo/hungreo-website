'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '../ui/Button'
import type { Video, VideoCategory } from '@/lib/videoManager'

const CATEGORIES: VideoCategory[] = ['Leadership', 'AI Works', 'Health', 'Entertaining', 'Human Philosophy']

interface VideoStats {
  leadership: number
  aiWorks: number
  health: number
  entertaining: number
  philosophy: number
  total: number
}

export function VideosManager() {
  const [videos, setVideos] = useState<Video[]>([])
  const [stats, setStats] = useState<VideoStats | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importUrls, setImportUrls] = useState('')
  const [importCategory, setImportCategory] = useState<VideoCategory>('Leadership')
  const [isImporting, setIsImporting] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [selectedCategory])

  const fetchVideos = async () => {
    try {
      setIsLoading(true)
      const url =
        selectedCategory === 'all'
          ? '/api/admin/videos'
          : `/api/admin/videos?category=${encodeURIComponent(selectedCategory)}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setVideos(data.videos)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchImport = async () => {
    const urls = importUrls.split('\n').filter((url) => url.trim())
    if (urls.length === 0) {
      alert('Please enter at least one YouTube URL')
      return
    }

    try {
      setIsImporting(true)
      const response = await fetch('/api/admin/videos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          category: importCategory,
          generateEmbeddings: false, // Can be enabled later
        }),
      })

      const data = await response.json()

      if (data.success) {
        const { result } = data
        alert(
          `Import complete!\nSuccess: ${result.success}\nFailed: ${result.failed}\n${
            result.errors.length > 0 ? '\nErrors:\n' + result.errors.map((e: any) => `${e.url}: ${e.error}`).join('\n') : ''
          }`
        )
        setImportUrls('')
        setShowImportModal(false)
        fetchVideos()
      } else {
        alert(`Import failed: ${data.error}`)
      }
    } catch (error) {
      alert('Import failed. Please try again.')
    } finally {
      setIsImporting(false)
    }
  }

  const handleGenerateEmbeddings = async (videoId: string) => {
    if (!window.confirm('Generate embeddings for this video? This will add it to the chatbot knowledge base.')) return

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateEmbeddings: true }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Embeddings generated successfully!')
        fetchVideos()
      } else {
        alert(`Failed: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to generate embeddings.')
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return

    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        alert('Video deleted successfully!')
        fetchVideos()
        setSelectedVideo(null)
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
          <h1 className="text-2xl font-bold text-slate-900">Videos Management</h1>
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
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Documents
            </Link>
            <Link
              href="/admin/videos"
              className="border-b-2 border-primary-600 px-3 py-2 text-sm font-medium text-primary-600"
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

        {/* Import Button */}
        <div className="mb-6">
          <Button onClick={() => setShowImportModal(true)}>+ Batch Import Videos</Button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              title="All Videos"
              count={stats.total}
              color="bg-blue-50 text-blue-700"
              active={selectedCategory === 'all'}
              onClick={() => setSelectedCategory('all')}
            />
            <StatCard
              title="Leadership"
              count={stats.leadership}
              color="bg-purple-50 text-purple-700"
              active={selectedCategory === 'Leadership'}
              onClick={() => setSelectedCategory('Leadership')}
            />
            <StatCard
              title="AI Works"
              count={stats.aiWorks}
              color="bg-green-50 text-green-700"
              active={selectedCategory === 'AI Works'}
              onClick={() => setSelectedCategory('AI Works')}
            />
            <StatCard
              title="Health"
              count={stats.health}
              color="bg-red-50 text-red-700"
              active={selectedCategory === 'Health'}
              onClick={() => setSelectedCategory('Health')}
            />
            <StatCard
              title="Entertaining"
              count={stats.entertaining}
              color="bg-yellow-50 text-yellow-700"
              active={selectedCategory === 'Entertaining'}
              onClick={() => setSelectedCategory('Entertaining')}
            />
            <StatCard
              title="Philosophy"
              count={stats.philosophy}
              color="bg-indigo-50 text-indigo-700"
              active={selectedCategory === 'Human Philosophy'}
              onClick={() => setSelectedCategory('Human Philosophy')}
            />
          </div>
        )}

        {/* Videos List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedCategory === 'all' ? 'All Videos' : `${selectedCategory} Videos`}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-slate-600">Loading...</span>
            </div>
          ) : videos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-slate-600">No videos found</span>
            </div>
          ) : (
            <div className="divide-y">
              {videos.map((video) => (
                <VideoRow
                  key={video.id}
                  video={video}
                  onSelect={() => setSelectedVideo(video)}
                  onGenerateEmbeddings={handleGenerateEmbeddings}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Import Modal */}
        {showImportModal && (
          <ImportModal
            urls={importUrls}
            category={importCategory}
            isImporting={isImporting}
            onUrlsChange={setImportUrls}
            onCategoryChange={setImportCategory}
            onImport={handleBatchImport}
            onClose={() => setShowImportModal(false)}
          />
        )}

        {/* Video Detail Modal */}
        {selectedVideo && (
          <VideoDetailModal
            video={selectedVideo}
            onClose={() => setSelectedVideo(null)}
            onGenerateEmbeddings={handleGenerateEmbeddings}
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

function VideoRow({
  video,
  onSelect,
  onGenerateEmbeddings,
  onDelete,
}: {
  video: Video
  onSelect: () => void
  onGenerateEmbeddings: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50">
      <img src={video.thumbnailUrl} alt={video.title} className="h-20 w-32 rounded object-cover" />
      <div className="flex-1">
        <button onClick={onSelect} className="text-left">
          <div className="font-medium text-slate-900">{video.title}</div>
          <div className="mt-1 text-sm text-slate-500">
            {video.channelTitle} • {video.category}
          </div>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {!video.pineconeIds && (
          <Button size="sm" onClick={() => onGenerateEmbeddings(video.id)}>
            Generate Embeddings
          </Button>
        )}
        {video.pineconeIds && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            In Knowledge Base
          </span>
        )}
        <button
          onClick={() => onDelete(video.id)}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function ImportModal({
  urls,
  category,
  isImporting,
  onUrlsChange,
  onCategoryChange,
  onImport,
  onClose,
}: {
  urls: string
  category: VideoCategory
  isImporting: boolean
  onUrlsChange: (urls: string) => void
  onCategoryChange: (category: VideoCategory) => void
  onImport: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Batch Import Videos</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value as VideoCategory)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              YouTube URLs (one per line)
            </label>
            <textarea
              value={urls}
              onChange={(e) => onUrlsChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={10}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={isImporting}
            />
            <p className="mt-1 text-xs text-slate-500">
              Paste YouTube URLs, one per line. The tool will extract video metadata and transcripts.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={onImport} disabled={isImporting}>
              {isImporting ? 'Importing...' : 'Import Videos'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoDetailModal({
  video,
  onClose,
  onGenerateEmbeddings,
  onDelete,
}: {
  video: Video
  onClose: () => void
  onGenerateEmbeddings: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{video.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Video Player */}
          <div className="mb-6">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${video.videoId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>

          {/* Metadata */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">Channel</label>
              <div className="mt-1 text-slate-900">{video.channelTitle}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Category</label>
              <div className="mt-1 text-slate-900">{video.category}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Published</label>
              <div className="mt-1 text-slate-900">
                {new Date(video.publishedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Status</label>
              <div className="mt-1">
                {video.pineconeIds ? (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    In Knowledge Base ({video.pineconeIds.length} chunks)
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                    Not in Knowledge Base
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="text-sm font-medium text-slate-600">Description</label>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
              {video.description}
            </div>
          </div>

          {/* Transcript */}
          {video.transcript && (
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600">
                Transcript ({video.transcript.split(' ').length} words)
              </label>
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
                {video.transcript.substring(0, 2000)}
                {video.transcript.length > 2000 && '...'}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button variant="outline" onClick={() => onDelete(video.id)} className="text-red-600">
              Delete
            </Button>
            <div className="flex gap-2">
              {!video.pineconeIds && (
                <Button onClick={() => onGenerateEmbeddings(video.id)}>
                  Generate Embeddings & Add to Knowledge Base
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
