'use client'

import { useEffect, useState } from 'react'
import { CategoryGrid } from '@/components/features/CategoryGrid'
import { useLanguage } from '@/contexts/LanguageContext'

export default function KnowledgePage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/videos?stats=true')
        const data = await response.json()
        if (data.success) {
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch video stats:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <span className="text-slate-600">{t('common.loading')}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-slate-900">
          {t('knowledge.title')}
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          {t('knowledge.subtitle')}
        </p>
      </div>

      {/* Category Grid */}
      <CategoryGrid stats={stats} />

      {/* Info Section */}
      <div className="mt-16 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">
          How it works
        </h2>
        <ul className="space-y-2 text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-primary-600">•</span>
            <span>Browse videos by category: Leadership, AI Works, Health, Entertaining, or Human Philosophy</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">•</span>
            <span>Each video page includes the full transcript and an AI chatbot</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600">•</span>
            <span>Ask questions about the video content and get instant, context-aware answers</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
