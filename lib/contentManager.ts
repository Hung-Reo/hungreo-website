/**
 * Content Manager - CRUD operations for CMS content in Vercel KV
 * Manages About content, Projects, and Blog Posts
 */

import { kv } from '@vercel/kv'
import { v4 as uuidv4 } from 'uuid'

// ============================================
// Content Models
// ============================================

export interface AboutContent {
  id: 'about' // Single document
  updatedAt: number
  updatedBy: string

  // Profile section (bilingual)
  en: {
    name: string
    role: string
    intro: string
    photo?: string // URL to uploaded image
  }
  vi: {
    name: string
    role: string
    intro: string
    photo?: string
  }

  // Beyond Work section (bilingual)
  beyondWork: {
    en: {
      bio: string
      interests: string
    }
    vi: {
      bio: string
      interests: string
    }
  }
}

export interface Project {
  id: string // UUID
  slug: string // URL-friendly slug
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
  createdBy: string

  // Bilingual content
  en: {
    title: string
    description: string
    content: string // Markdown
  }
  vi: {
    title: string
    description: string
    content: string // Markdown
  }

  // Project metadata
  tech: string[] // ['React', 'TypeScript', 'Tailwind']
  image?: string // Featured image URL
  github?: string // GitHub repo URL
  demo?: string // Live demo URL
  featured: boolean // Show on homepage?
}

export interface BlogPost {
  id: string // UUID
  slug: string // URL-friendly slug
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
  publishedAt?: number
  createdBy: string

  // Bilingual content
  en: {
    title: string
    description: string
    content: string // Markdown
  }
  vi: {
    title: string
    description: string
    content: string // Markdown
  }

  // Blog metadata
  tags: string[] // ['product-management', 'ai', 'lessons']
  image?: string // Featured image URL
  featured: boolean // Show on homepage?
  readingTime?: number // Auto-calculated in minutes
}

// ============================================
// About Content
// ============================================

export async function getAboutContent(): Promise<AboutContent | null> {
  try {
    return await kv.get<AboutContent>('content:about')
  } catch (error) {
    console.error('Error fetching about content:', error)
    return null
  }
}

export async function saveAboutContent(content: AboutContent): Promise<void> {
  try {
    await kv.set('content:about', content)
  } catch (error) {
    console.error('Error saving about content:', error)
    throw error
  }
}

// ============================================
// Projects
// ============================================

export async function getProject(id: string): Promise<Project | null> {
  try {
    return await kv.get<Project>(`project:${id}`)
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

export async function getAllProjects(): Promise<Project[]> {
  try {
    const keys = await kv.keys('project:*')

    // Filter out slug index keys
    const projectKeys = keys.filter(key => !key.includes(':slug:'))

    const projects = await Promise.all(
      projectKeys.map(key => kv.get<Project>(key))
    )

    return projects.filter(Boolean) as Project[]
  } catch (error) {
    console.error('Error fetching all projects:', error)
    return []
  }
}

export async function getPublishedProjects(): Promise<Project[]> {
  const all = await getAllProjects()
  return all
    .filter(p => p.status === 'published')
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveProject(project: Project): Promise<void> {
  try {
    await kv.set(`project:${project.id}`, project)

    // Update slug index for quick lookup
    await kv.set(`project:slug:${project.slug}`, project.id)
  } catch (error) {
    console.error('Error saving project:', error)
    throw error
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const id = await kv.get<string>(`project:slug:${slug}`)
    if (!id) return null
    return await getProject(id)
  } catch (error) {
    console.error('Error fetching project by slug:', error)
    return null
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const project = await getProject(id)
    if (project) {
      await kv.del(`project:${id}`)
      await kv.del(`project:slug:${project.slug}`)
    }
  } catch (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

// ============================================
// Blog Posts
// ============================================

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  try {
    return await kv.get<BlogPost>(`blog:${id}`)
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const keys = await kv.keys('blog:*')

    // Filter out slug index keys
    const blogKeys = keys.filter(key => !key.includes(':slug:'))

    const posts = await Promise.all(
      blogKeys.map(key => kv.get<BlogPost>(key))
    )

    return posts.filter(Boolean) as BlogPost[]
  } catch (error) {
    console.error('Error fetching all blog posts:', error)
    return []
  }
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const all = await getAllBlogPosts()
  return all
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))
}

export async function saveBlogPost(post: BlogPost): Promise<void> {
  try {
    // Auto-calculate reading time if content exists
    if (post.en.content) {
      post.readingTime = calculateReadingTime(post.en.content)
    }

    await kv.set(`blog:${post.id}`, post)
    await kv.set(`blog:slug:${post.slug}`, post.id)
  } catch (error) {
    console.error('Error saving blog post:', error)
    throw error
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const id = await kv.get<string>(`blog:slug:${slug}`)
    if (!id) return null
    return await getBlogPost(id)
  } catch (error) {
    console.error('Error fetching blog post by slug:', error)
    return null
  }
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const post = await getBlogPost(id)
    if (post) {
      await kv.del(`blog:${id}`)
      await kv.del(`blog:slug:${post.slug}`)
    }
  } catch (error) {
    console.error('Error deleting blog post:', error)
    throw error
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Calculate reading time in minutes
 * Assumes average reading speed of 200 words per minute
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  return Math.max(1, readingTime) // Minimum 1 minute
}

/**
 * Generate UUID for new content
 */
export function generateId(): string {
  return uuidv4()
}
