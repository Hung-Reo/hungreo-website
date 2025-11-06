'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

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

export default function YouTubeSummarizer() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState('')

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
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900">
            YouTube Video Summarizer
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Tóm tắt nhanh nội dung video YouTube bằng AI
          </p>
        </div>

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
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                'Tóm tắt video'
              )}
            </Button>
          </form>
        </Card>

        {/* Result */}
        {result && (
          <Card className="p-6">
            <div className="space-y-6">
              {/* Video Info */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {result.metadata.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Channel: {result.metadata.channelTitle}
                </p>
                <p className="text-sm text-slate-600">
                  Published:{' '}
                  {new Date(result.metadata.publishedAt).toLocaleDateString(
                    'vi-VN'
                  )}
                </p>
              </div>

              {/* Video Embed */}
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${result.videoId}`}
                  title={result.metadata.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full rounded-lg"
                />
              </div>

              {/* Summary */}
              <div>
                <h3 className="mb-4 text-xl font-semibold text-slate-900">
                  Tóm tắt nội dung
                </h3>
                <div className="prose prose-slate max-w-none">
                  <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-slate-700">
                    {result.summary}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        {!result && !isLoading && (
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Hướng dẫn sử dụng
            </h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>
                  Copy URL của video YouTube bạn muốn tóm tắt (ví dụ:
                  https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>Paste URL vào ô nhập liệu phía trên</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>
                  Nhấn "Tóm tắt video" và đợi AI xử lý (thường mất 10-30 giây)
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <span>
                  Đọc tóm tắt nội dung video một cách nhanh chóng và tiện lợi
                </span>
              </li>
            </ul>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Công cụ này sử dụng AI để tóm tắt nội
                dung dựa trên thông tin có sẵn của video. Độ chính xác phụ
                thuộc vào chất lượng mô tả video từ YouTube.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
