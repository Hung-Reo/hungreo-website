'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '../ui/Button'
import type { ChatStats } from '@/lib/chatLogger'

export function AdminDashboard() {
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScraping, setIsScraping] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      } else {
        setError('Failed to load statistics')
      }
    } catch (err) {
      setError('An error occurred while loading statistics')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' })
  }

  const handleScrapeWebsite = async () => {
    if (!window.confirm('This will scrape all public pages and update the knowledge base. Continue?')) return

    try {
      setIsScraping(true)
      const response = await fetch('/api/admin/scrape', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        const { result } = data
        alert(
          `Website scraped successfully!\n\nPages scraped: ${result.pagesScraped}\nVectors created: ${result.vectorsCreated}\n${
            result.errors.length > 0 ? '\nErrors:\n' + result.errors.join('\n') : ''
          }`
        )
      } else {
        alert(`Scrape failed: ${data.error}`)
      }
    } catch (error) {
      alert('Scrape failed. Please try again.')
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 border-b">
          <nav className="flex gap-6 overflow-x-auto">
            <Link
              href="/admin/dashboard"
              className="border-b-2 border-primary-600 px-3 py-2 text-sm font-medium text-primary-600 whitespace-nowrap"
            >
              Statistics
            </Link>
            <Link
              href="/admin/content/about"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              About Page
            </Link>
            <Link
              href="/admin/content/projects"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Projects
            </Link>
            <Link
              href="/admin/content/blog"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Blog
            </Link>
            <Link
              href="/admin/documents"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Documents
            </Link>
            <Link
              href="/admin/videos"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Videos
            </Link>
            <Link
              href="/admin/vectors"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Vector DB
            </Link>
            <Link
              href="/admin/chatlogs"
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
            >
              Chat Logs
            </Link>
          </nav>
        </div>

        {/* Statistics */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading statistics...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Chats"
                value={stats.totalChats}
                icon="💬"
                color="bg-blue-50 text-blue-600"
              />
              <StatCard
                title="Today"
                value={stats.chatsToday}
                icon="📅"
                color="bg-green-50 text-green-600"
              />
              <StatCard
                title="This Week"
                value={stats.chatsThisWeek}
                icon="📊"
                color="bg-purple-50 text-purple-600"
              />
              <StatCard
                title="Needs Reply"
                value={stats.needsReply}
                icon="⚠️"
                color="bg-red-50 text-red-600"
              />
            </div>

            {/* Top Questions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Questions</h2>
              {stats.topQuestions.length === 0 ? (
                <p className="text-sm text-slate-600">No questions yet</p>
              ) : (
                <div className="space-y-3">
                  {stats.topQuestions.map((q, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b pb-2 last:border-0"
                    >
                      <span className="text-sm text-slate-700">{q.question}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {q.count}x
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/admin/content/about"
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="text-2xl">👤</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Edit About Page</div>
                </Link>
                <Link
                  href="/admin/content/projects/new"
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="text-2xl">🚀</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Create Project</div>
                </Link>
                <Link
                  href="/admin/content/blog/new"
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="text-2xl">✍️</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Write Blog Post</div>
                </Link>
                <Link
                  href="/admin/documents"
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="text-2xl">📄</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Upload Document</div>
                </Link>
                <Link
                  href="/admin/videos"
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="text-2xl">🎥</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Add Videos</div>
                </Link>
                <button
                  onClick={fetchStats}
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="text-2xl">🔄</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">Refresh Stats</div>
                </button>
                <button
                  onClick={handleScrapeWebsite}
                  disabled={isScraping}
                  className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center transition-colors hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50"
                >
                  <div className="text-2xl">🕷️</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">
                    {isScraping ? 'Scraping...' : 'Scrape Website'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: string
  color: string
}) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}
