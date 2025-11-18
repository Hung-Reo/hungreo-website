import type { Metadata } from 'next'
import { getBlogPostBySlug } from '@/lib/contentManager'
import { generateBlogPostMetadata, generateBlogPostJsonLd } from '@/lib/metadata'

type Props = {
  params: { slug: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)

  if (!post || post.status !== 'published') {
    return {
      title: 'Post Not Found',
      description: 'The requested blog post could not be found.',
    }
  }

  // Default to English for metadata (can be enhanced with language detection)
  return generateBlogPostMetadata(post, 'en')
}

export default async function BlogPostLayout({ params, children }: Props) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post || post.status !== 'published') {
    return children
  }

  const jsonLd = generateBlogPostJsonLd(post, 'en')

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
