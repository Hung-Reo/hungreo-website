import type { Metadata } from 'next'
import { getProjectBySlug } from '@/lib/contentManager'
import { generateProjectMetadata, generateProjectJsonLd } from '@/lib/metadata'

type Props = {
  params: { slug: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug)

  if (!project || project.status !== 'published') {
    return {
      title: 'Project Not Found',
      description: 'The requested project could not be found.',
    }
  }

  // Default to English for metadata (can be enhanced with language detection)
  return generateProjectMetadata(project, 'en')
}

export default async function ProjectLayout({ params, children }: Props) {
  const project = await getProjectBySlug(params.slug)

  if (!project || project.status !== 'published') {
    return children
  }

  const jsonLd = generateProjectJsonLd(project, 'en')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
