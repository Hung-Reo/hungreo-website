import type { Metadata } from 'next'
import type { BlogPost, Project } from './contentManager'

/**
 * Base URL for the website
 */
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hungreo.com'

/**
 * Default metadata values
 */
export const DEFAULT_METADATA = {
  siteName: 'Hung Reo',
  author: 'Hung Reo',
  locale: 'en_US',
  twitter: '@hungreo', // Update with actual Twitter handle
}

/**
 * Generate metadata for static pages
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
}: {
  title: string
  description: string
  path?: string
  image?: string
}): Metadata {
  const url = `${BASE_URL}${path}`
  const ogImage = image || `${BASE_URL}/og-default.jpg`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: DEFAULT_METADATA.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: DEFAULT_METADATA.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: DEFAULT_METADATA.twitter,
    },
  }
}

/**
 * Generate metadata for blog posts
 */
export function generateBlogPostMetadata(post: BlogPost, lang: 'en' | 'vi' = 'en'): Metadata {
  const title = post[lang].title
  const description = post[lang].excerpt || post[lang].title
  const url = `${BASE_URL}/blog/${post.slug}`
  const image = post.featuredImage || `${BASE_URL}/og-default.jpg`
  const publishedTime = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date(post.createdAt).toISOString()
  const modifiedTime = new Date(post.updatedAt).toISOString()

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: DEFAULT_METADATA.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: lang === 'vi' ? 'vi_VN' : DEFAULT_METADATA.locale,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: [DEFAULT_METADATA.author],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: DEFAULT_METADATA.twitter,
    },
  }
}

/**
 * Generate metadata for projects
 */
export function generateProjectMetadata(project: Project, lang: 'en' | 'vi' = 'en'): Metadata {
  const title = project[lang].title
  const description = project[lang].description || project[lang].title
  const url = `${BASE_URL}/projects/${project.slug}`
  const image = project.featuredImage || `${BASE_URL}/og-default.jpg`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: DEFAULT_METADATA.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: lang === 'vi' ? 'vi_VN' : DEFAULT_METADATA.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: DEFAULT_METADATA.twitter,
    },
  }
}

/**
 * Generate JSON-LD structured data for blog posts
 */
export function generateBlogPostJsonLd(post: BlogPost, lang: 'en' | 'vi' = 'en') {
  const publishedTime = post.publishedAt
    ? new Date(post.publishedAt).toISOString()
    : new Date(post.createdAt).toISOString()
  const modifiedTime = new Date(post.updatedAt).toISOString()

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post[lang].title,
    description: post[lang].excerpt,
    image: post.featuredImage,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    author: {
      '@type': 'Person',
      name: DEFAULT_METADATA.author,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Person',
      name: DEFAULT_METADATA.author,
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  }
}

/**
 * Generate JSON-LD structured data for projects
 */
export function generateProjectJsonLd(project: Project, lang: 'en' | 'vi' = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project[lang].title,
    description: project[lang].description,
    image: project.featuredImage,
    author: {
      '@type': 'Person',
      name: DEFAULT_METADATA.author,
      url: BASE_URL,
    },
    url: `${BASE_URL}/projects/${project.slug}`,
    keywords: project.techStack?.join(', '),
  }
}
