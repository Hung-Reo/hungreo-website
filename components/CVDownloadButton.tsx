'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export function CVDownloadButton() {
  const { t } = useLanguage()
  const [cvUrl, setCvUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCV() {
      try {
        const res = await fetch('/api/cv')
        if (res.ok) {
          const data = await res.json()
          setCvUrl(data.cv.url)
        }
      } catch (error) {
        console.error('Failed to fetch CV:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCV()
  }, [])

  if (loading) {
    return (
      <button
        disabled
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-400"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('home.hero.loadingCV')}
      </button>
    )
  }

  if (!cvUrl) {
    // No CV uploaded - show disabled button or hide completely
    return null
  }

  return (
    <a
      href={cvUrl}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-600 bg-white px-4 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50"
    >
      <Download className="h-4 w-4" />
      {t('home.hero.downloadCV')}
    </a>
  )
}
