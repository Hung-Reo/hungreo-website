import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { getContentBySlug, getContentByType, ProjectMeta } from '@/lib/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

export async function generateStaticParams() {
  const projects = getContentByType<ProjectMeta>('projects')
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  try {
    const { meta } = getContentBySlug('projects', params.slug)
    return {
      title: `${meta.title} - Projects`,
      description: meta.description,
    }
  } catch {
    return {
      title: 'Project Not Found',
    }
  }
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  let content, meta

  try {
    const result = getContentBySlug('projects', params.slug)
    content = result.content
    meta = result.meta
  } catch {
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Back button */}
        <Link
          href="/projects"
          className="inline-flex items-center text-sm text-slate-600 hover:text-primary-600"
        >
          ← Back to Projects
        </Link>

        {/* Header */}
        <header className="mt-8">
          <h1 className="text-4xl font-bold text-slate-900">{meta.title}</h1>
          <p className="mt-4 text-xl text-slate-600">{meta.description}</p>

          {/* Tech stack */}
          <div className="mt-6 flex flex-wrap gap-2">
            {meta.tech.map((tech: string) => (
              <span
                key={tech}
                className="rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Links */}
          {(meta.github || meta.demo) && (
            <div className="mt-6 flex gap-4">
              {meta.github && (
                <Button asChild>
                  <a href={meta.github} target="_blank" rel="noopener">
                    View on GitHub
                  </a>
                </Button>
              )}
              {meta.demo && (
                <Button variant="outline" asChild>
                  <a href={meta.demo} target="_blank" rel="noopener">
                    Live Demo
                  </a>
                </Button>
              )}
            </div>
          )}
        </header>

        {/* Featured image */}
        {meta.image && (
          <div className="relative mt-12 h-96 w-full overflow-hidden rounded-lg bg-slate-100">
            <img
              src={meta.image}
              alt={meta.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-slate mt-12 max-w-none">
          <MDXRemote
            source={content}
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
