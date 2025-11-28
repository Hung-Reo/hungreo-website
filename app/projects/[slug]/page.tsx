'use client'

import { useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Project } from '@/lib/contentManager'
import { Loader2, ArrowLeft, Github, ExternalLink, Lightbulb, Code } from 'lucide-react'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'

// Configure marked for better parsing
marked.setOptions({
  breaks: true,
  gfm: true,
})

// Helper function to convert content to HTML
// Always converts Markdown to HTML, regardless of existing HTML tags
function contentToHTML(content: string): string {
  if (!content) return ''

  try {
    // Strip any wrapping HTML tags (AI parser sometimes wraps content in <p> tags)
    let cleanContent = content

    // Remove opening and closing <p> tags if they wrap the entire content
    if (cleanContent.startsWith('<p>') && cleanContent.endsWith('</p>')) {
      cleanContent = cleanContent.slice(3, -4)
    }

    // Also remove any stray <p> or </p> tags
    cleanContent = cleanContent.replace(/<\/?p>/g, '')

    // Parse markdown to HTML
    const html = marked.parse(cleanContent) as string

    return html
  } catch (error) {
    console.error('Markdown parsing error:', error)
    return content
  }
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const { language, t } = useLanguage()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [relatedProjects, setRelatedProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current project
        const projectRes = await fetch(`/api/content/projects/${params.slug}`)
        if (!projectRes.ok) {
          setNotFoundError(true)
          return
        }
        const projectData = await projectRes.json()
        setProject(projectData)

        // Fetch all projects for related section
        const allProjectsRes = await fetch('/api/content/projects')
        if (allProjectsRes.ok) {
          const allProjectsData = await allProjectsRes.json()

          // Find related projects (same tech stack, excluding current)
          const related = (allProjectsData.projects || [])
            .filter((p: Project) =>
              p.slug !== params.slug &&
              p.techStack?.some(tech => projectData.techStack?.includes(tech))
            )
            .slice(0, 3)

          setRelatedProjects(related)
        }
      } catch (error) {
        console.error('Failed to fetch project:', error)
        setNotFoundError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (notFoundError || !project) {
    notFound()
  }

  const lang = language === 'en' ? 'en' : 'vi'

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Back button */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('projects.backToProjects')}
        </Link>

        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {project[lang].title}
          </h1>
          <p className="text-xl text-slate-600">
            {project[lang].description}
          </p>

          {/* Tech stack */}
          <div className="mt-6 flex flex-wrap gap-2">
            {project.techStack?.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action buttons */}
          {(project.githubUrl || project.demoUrl) && (
            <div className="mt-8 flex flex-wrap gap-4">
              {project.githubUrl && (
                <Button asChild>
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Github className="h-5 w-5" />
                    {t('projects.viewCode')}
                  </a>
                </Button>
              )}
              {project.demoUrl && (
                <Button variant="outline" asChild>
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-5 w-5" />
                    {t('projects.liveDemo')}
                  </a>
                </Button>
              )}
            </div>
          )}
        </header>

        {/* Featured image */}
        {project.featuredImage && (
          <div className="mb-12 max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg">
            <img
              src={project.featuredImage}
              alt={project[lang].title}
              className="w-full h-auto object-contain"
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-slate prose-lg max-w-none mb-12"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(contentToHTML(project[lang].content || ''))
          }}
        />

        {/* Screenshots Gallery */}
        {project.screenshots && project.screenshots.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Code className="h-6 w-6 text-primary-600" />
              {t('projects.screenshots')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {project.screenshots.map((screenshot, index) => (
                <div
                  key={index}
                  className="rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={screenshot}
                    alt={`${project[lang].title} screenshot ${index + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Learnings */}
        {project.learnings && project.learnings.length > 0 && (
          <section className="mb-12 bg-amber-50 border border-amber-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-amber-600" />
              {t('projects.keyLearnings')}
            </h2>
            <ul className="space-y-3">
              {project.learnings.map((learning, index) => (
                <li key={index} className="flex items-start gap-3 text-slate-700">
                  <span className="text-amber-600 font-bold mt-1">•</span>
                  <span>{learning}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section className="mt-16 pt-12 border-t">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {t('projects.relatedProjects')}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedProjects.map((relatedProject) => (
                <div
                  key={relatedProject.id}
                  onClick={() => router.push(`/projects/${relatedProject.slug}`)}
                  className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                >
                  {relatedProject.featuredImage && (
                    <div className="aspect-video overflow-hidden bg-slate-100">
                      <img
                        src={relatedProject.featuredImage}
                        alt={relatedProject[lang].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors mb-2">
                      {relatedProject[lang].title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {relatedProject[lang].description}
                    </p>
                    {relatedProject.techStack && relatedProject.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {relatedProject.techStack.slice(0, 2).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {tech}
                          </span>
                        ))}
                        {relatedProject.techStack.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                            +{relatedProject.techStack.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
