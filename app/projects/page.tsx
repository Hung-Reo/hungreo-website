import { Metadata } from 'next'
import { ProjectCard } from '@/components/features/ProjectCard'
import { getContentByType, ProjectMeta } from '@/lib/mdx'

export const metadata: Metadata = {
  title: 'Projects - Hung Dinh',
  description: 'AI-powered projects showcasing problem-solving and technical skills',
}

export default function ProjectsPage() {
  const projects = getContentByType<ProjectMeta>('projects')

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold text-slate-900">Projects</h1>
        <p className="mt-4 text-xl text-slate-600">
          AI-powered solutions built to solve real problems
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="mt-12 rounded-lg border bg-white p-12 text-center">
            <p className="text-slate-600">
              Projects coming soon... Building in progress! 🚀
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Check back later for AI-powered project showcases
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
