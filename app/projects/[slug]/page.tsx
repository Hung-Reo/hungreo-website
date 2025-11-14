'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

interface Project {
  id: string
  slug: string
  en: { title: string; description: string; content: string }
  vi: { title: string; description: string; content: string }
  tech: string[]
  image?: string
  github?: string
  demo?: string
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const { t, language } = useLanguage()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/content/projects/${params.slug}`)
        if (!res.ok) {
          setNotFoundError(true)
          return
        }
        const data = await res.json()
        setProject(data)
      } catch (error) {
        console.error('Failed to fetch project:', error)
        setNotFoundError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    )
  }

  if (notFoundError || !project) {
    notFound()
  }

  const content = language === 'vi' && project.vi.title ? project.vi : project.en

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Back button */}
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-slate-600 hover:text-primary-600"
        >
          {t('projects.backToProjects')}
        </Link>

        {/* Header */}
        <header className="mt-8">
          <h1 className="text-4xl font-bold text-slate-900">{content.title}</h1>
          <p className="mt-4 text-xl text-slate-600">{content.description}</p>

          {/* Tech stack */}
          <div className="mt-6 flex flex-wrap gap-2">
            {project.tech.map((tech: string) => (
              <span
                key={tech}
                className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Links */}
          {(project.github || project.demo) && (
            <div className="mt-6 flex gap-4">
              {project.github && (
                <Button asChild>
                  <a href={project.github} target="_blank" rel="noopener">
                    {t('projects.viewGithub')}
                  </a>
                </Button>
              )}
              {project.demo && (
                <Button variant="outline" asChild>
                  <a href={project.demo} target="_blank" rel="noopener">
                    {t('projects.liveDemo')}
                  </a>
                </Button>
              )}
            </div>
          )}
        </header>

        {/* Featured image */}
        {project.image && (
          <div className="relative mt-12 h-96 w-full overflow-hidden rounded-lg bg-slate-100">
            <img
              src={project.image}
              alt={content.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate mt-12 max-w-none">
          <MDXRemote
            source={content.content}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeHighlight],
              },
            }}
          />
        </div>
      </div>
    </article>
  )
}
