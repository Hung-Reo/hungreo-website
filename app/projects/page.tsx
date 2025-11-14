'use client'

import { useState, useEffect } from 'react'
import { ProjectCard } from '@/components/features/ProjectCard'
import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'

interface Project {
  id: string
  slug: string
  status: 'draft' | 'published'
  en: { title: string; description: string; content: string }
  vi: { title: string; description: string; content: string }
  tech: string[]
  image?: string
  github?: string
  demo?: string
  featured: boolean
}

export default function ProjectsPage() {
  const { t, language } = useLanguage()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/admin/content/projects?status=published', {
          next: { revalidate: 60 }, // ISR: 60 seconds
        })
        if (res.ok) {
          const data = await res.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">{t('projects.title')}</h1>
        <p className="mt-4 text-xl text-slate-600">
          {t('projects.subtitle')}
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const content = language === 'vi' && project.vi.title ? project.vi : project.en
            return (
              <ProjectCard
                key={project.slug}
                project={{
                  slug: project.slug,
                  title: content.title,
                  description: content.description,
                  tech: project.tech,
                  image: project.image || '',
                  github: project.github,
                  demo: project.demo,
                }}
              />
            )
          })}
        </div>

        {projects.length === 0 && (
          <div className="mt-12 rounded-lg border bg-white p-12 text-center">
            <p className="text-slate-600">
              {t('projects.empty')}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {t('projects.emptySubtitle')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
