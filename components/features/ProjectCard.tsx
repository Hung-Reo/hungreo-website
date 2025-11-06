import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { ProjectMeta } from '@/lib/mdx'

interface ProjectCardProps {
  project: ProjectMeta
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.slug}`}>
      <Card className="h-full overflow-hidden">
        <div className="relative h-48 w-full bg-slate-100">
          {project.image ? (
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              Project Image
            </div>
          )}
        </div>
        <CardHeader>
          <h3 className="text-xl font-semibold text-slate-900">
            {project.title}
          </h3>
          <p className="mt-2 text-slate-600">{project.description}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-600"
              >
                {tech}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
