'use client'

import { ProjectCard } from '@/components/features/ProjectCard'
import { getContentByType, ProjectMeta } from '@/lib/mdx'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ProjectsPage() {
  const { t } = useLanguage()
  const projects = getContentByType<ProjectMeta>('projects')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">{t('projects.title')}</h1>
        <p className="mt-4 text-xl text-slate-600">
          {t('projects.subtitle')}
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
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
