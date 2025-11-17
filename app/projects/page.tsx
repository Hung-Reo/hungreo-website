'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/contentManager'
import { Loader2, Github, ExternalLink, Star } from 'lucide-react'

export default function ProjectsPage() {
  const { language } = useLanguage()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTech, setSelectedTech] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/content/projects')
      if (!res.ok) throw new Error('Failed to load projects')

      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !projects) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Failed to load projects</p>
      </div>
    )
  }

  const lang = language === 'en' ? 'en' : 'vi'

  // Get all unique tech stack items
  const allTechStack = Array.from(
    new Set(projects.flatMap((p) => p.techStack || []))
  ).sort()

  // Filter projects by selected tech
  const filteredProjects = selectedTech
    ? projects.filter((p) => p.techStack?.includes(selectedTech))
    : projects

  // Separate featured and regular projects
  const featuredProjects = filteredProjects.filter((p) => p.featured)
  const regularProjects = filteredProjects.filter((p) => !p.featured)

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {lang === 'en' ? 'Projects' : 'Dự án'}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {lang === 'en'
              ? 'Explore my portfolio of projects, experiments, and technical explorations.'
              : 'Khám phá các dự án, thử nghiệm và khám phá kỹ thuật của tôi.'}
          </p>
        </div>

        {/* Tech Stack Filter */}
        {allTechStack.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              {lang === 'en' ? 'Filter by Tech Stack:' : 'Lọc theo công nghệ:'}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTech(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTech === null
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lang === 'en' ? 'All' : 'Tất cả'} ({projects.length})
              </button>
              {allTechStack.map((tech) => {
                const count = projects.filter((p) =>
                  p.techStack?.includes(tech)
                ).length
                return (
                  <button
                    key={tech}
                    onClick={() => setSelectedTech(tech)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTech === tech
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tech} ({count})
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-600">
              {lang === 'en'
                ? 'No projects found with this technology.'
                : 'Không tìm thấy dự án nào với công nghệ này.'}
            </p>
            <button
              onClick={() => setSelectedTech(null)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              {lang === 'en' ? 'Clear filter' : 'Xóa bộ lọc'}
            </button>
          </div>
        )}

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold text-slate-900">
                {lang === 'en' ? 'Featured Projects' : 'Dự án nổi bật'}
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  lang={lang}
                  router={router}
                />
              ))}
            </div>
          </section>
        )}

        {/* Regular Projects */}
        {regularProjects.length > 0 && (
          <section>
            {featuredProjects.length > 0 && (
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {lang === 'en' ? 'All Projects' : 'Tất cả dự án'}
              </h2>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  lang={lang}
                  router={router}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  lang: 'en' | 'vi'
  router: any
}

function ProjectCard({ project, lang, router }: ProjectCardProps) {
  return (
    <div
      onClick={() => router.push(`/projects/${project.slug}`)}
      className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
    >
      {/* Featured Image */}
      {project.featuredImage && (
        <div className="aspect-video overflow-hidden bg-slate-100">
          <img
            src={project.featuredImage}
            alt={project[lang].title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="p-6">
        {/* Title */}
        <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
          {project[lang].title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 mb-4 line-clamp-2">
          {project[lang].description}
        </p>

        {/* Tech Stack */}
        {project.techStack && project.techStack.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.techStack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded">
                +{project.techStack.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Links */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Github className="h-4 w-4" />
              Code
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {lang === 'en' ? 'Live Demo' : 'Demo'}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
