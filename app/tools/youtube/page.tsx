'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import type { VideoCategory } from '@/lib/videoManager'

interface VideoMetadata {
  title: string
  description: string
  channelTitle: string
  publishedAt: string
  duration: string
}

interface SummaryResult {
  videoId: string
  metadata: VideoMetadata
  summary: string
}

interface PublicVideo {
  id: string
  videoId: string
  title: string
  channelTitle: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  category: VideoCategory
}

const CATEGORIES: VideoCategory[] = ['Leadership', 'AI Works', 'Health', 'Entertaining', 'Human Philosophy']

export default function YouTubeTools() {
  const [activeTab, setActiveTab] = useState<'summarizer' | 'library'>('library')

  // Summarizer state
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState('')

  // Library state
  const [videos, setVideos] = useState<PublicVideo[]>([])
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | 'all'>('all')
  const [isLoadingVideos, setIsLoadingVideos] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<PublicVideo | null>(null)

  useEffect(() => {
    if (activeTab === 'library') {
      fetchVideos()
    }
  }, [activeTab, selectedCategory])

  const fetchVideos = async () => {
    try {
      setIsLoadingVideos(true)
      const url =
        selectedCategory === 'all'
          ? '/api/videos'
          : `/api/videos?category=${encodeURIComponent(selectedCategory)}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setIsLoadingVideos(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!url.trim()) {
      setError('Vui lòng nhập URL YouTube')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Không thể tóm tắt video. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">AI Tools</h1>
          <p className="mt-4 text-lg text-slate-600">
            YouTube Video Summarizer & Curated Video Library
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex justify-center border-b">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'library'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Video Library
          </button>
          <button
            onClick={() => setActiveTab('summarizer')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'summarizer'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Video Summarizer
          </button>
        </div>

        {/* Video Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Videos
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Videos Grid */}
            {isLoadingVideos ? (
              <div className="flex items-center justify-center py-12">
                <span className="text-slate-600">Loading videos...</span>
              </div>
            ) : videos.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-slate-600">No videos found in this category</p>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => setSelectedVideo(video)}
                  />
                ))}
              </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
              <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}
          </div>
        )}

        {/* Summarizer Tab */}
        {activeTab === 'summarizer' && (
          <div className="mx-auto max-w-4xl">
            {/* Input Form */}
            <Card className="mb-8 p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="youtube-url"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    YouTube URL
                  </label>
                  <Input
                    id="youtube-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</div>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Đang xử lý...' : 'Tóm tắt video'}
                </Button>
              </form>
            </Card>

            {/* Result */}
            {result && (
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{result.metadata.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      Channel: {result.metadata.channelTitle}
                    </p>
                  </div>

                  <div className="aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${result.videoId}`}
                      title={result.metadata.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full rounded-lg"
                    />
                  </div>

                  <div>
                    <h3 className="mb-4 text-xl font-semibold text-slate-900">Tóm tắt nội dung</h3>
                    <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-700">
                      {result.summary}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function VideoCard({ video, onClick }: { video: PublicVideo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-lg bg-white shadow transition-all hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs text-white">
          {video.category}
        </span>
      </div>
      <div className="p-4 text-left">
        <h3 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-primary-600">
          {video.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">{video.channelTitle}</p>
      </div>
    </button>
  )
}

function VideoModal({ video, onClose }: { video: PublicVideo; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{video.title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Video Player */}
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${video.videoId}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-lg"
            />
          </div>

          {/* Metadata */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600">Channel</label>
              <div className="mt-1 text-slate-900">{video.channelTitle}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Category</label>
              <div className="mt-1">
                <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                  {video.category}
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600">Published</label>
              <div className="mt-1 text-slate-900">
                {new Date(video.publishedAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-600">Description</label>
            <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border bg-slate-50 p-4 text-sm text-slate-700">
              {video.description}
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end">
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
