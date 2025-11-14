'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Grid, List, Search } from 'lucide-react'
import { Video } from '@/lib/videoManager'
import { useLanguage } from '@/contexts/LanguageContext'

interface VideoGridProps {
  videos: Video[]
  categorySlug: string
}

export function VideoGrid({ videos, categorySlug }: VideoGridProps) {
  const { language, t } = useLanguage()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter videos based on search (search in current language)
  const filteredVideos = videos.filter((video) => {
    const query = searchQuery.toLowerCase()
    const content = video[language] || video.en
    return (
      content.title.toLowerCase().includes(query) ||
      video.channelTitle.toLowerCase().includes(query) ||
      content.description.toLowerCase().includes(query)
    )
  })

  // Convert YouTube duration to readable format
  function formatDuration(isoDuration: string): string {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return ''

    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Create slug from video ID
  function createVideoSlug(videoId: string, title: string): string {
    const titleSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 50)
    return `${titleSlug}-${videoId}`
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-2 ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="Grid view"
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-2 ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-label="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="mb-4 text-sm text-slate-600">
          Found {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Videos */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            {searchQuery ? t('knowledge.noVideosSearch') : t('knowledge.noVideos')}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => {
            const content = video[language] || video.en
            return (
              <Link
                key={video.id}
                href={`/tools/knowledge/${categorySlug}/${createVideoSlug(video.videoId, content.title)}`}
                className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  <Image
                    src={video.thumbnailUrl}
                    alt={content.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {/* Duration badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs font-medium text-white">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 font-semibold text-slate-900 group-hover:text-primary-600">
                    {content.title}
                  </h3>
                  <p className="mb-2 text-sm text-slate-600">{video.channelTitle}</p>
                  <p className="line-clamp-2 text-sm text-slate-500">{content.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => {
            const content = video[language] || video.en
            return (
              <Link
                key={video.id}
                href={`/tools/knowledge/${categorySlug}/${createVideoSlug(video.videoId, content.title)}`}
                className="group flex gap-4 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                  <Image
                    src={video.thumbnailUrl}
                    alt={content.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {video.duration && (
                    <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="mb-1 line-clamp-2 font-semibold text-slate-900 group-hover:text-primary-600">
                    {content.title}
                  </h3>
                  <p className="mb-2 text-sm text-slate-600">{video.channelTitle}</p>
                  <p className="line-clamp-2 text-sm text-slate-500">{content.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
