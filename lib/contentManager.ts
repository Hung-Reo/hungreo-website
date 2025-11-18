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
  version: string // "1.0.0"
  updatedAt: number
  updatedBy: string

  // CV Metadata
  cv?: {
    fileName: string
    fileUrl: string // Vercel Blob URL
    uploadedAt: number
    detectedLanguage: 'en' | 'vi'
  }

  // Hero Section (Basic Information)
  hero: {
    en: {
      name: string
      role: string
      intro: string // 2-3 sentences
      photo?: string // Vercel Blob URL
    }
    vi: {
      name: string
      role: string
      intro: string
      photo?: string // Same photo URL
    }
  }

  // Section 1: Professional Journey
  professionalJourney: {
    en: Array<{
      id: string // UUID
      year: string // "Mar 2025 - Oct 2025"
      title: string // "AI Consultant"
      company: string // "Pétrus Ký Primary & High School"
      description: string
    }>
    vi: Array<{
      id: string
      year: string
      title: string
      company: string
      description: string
    }>
  }

  // Section 2: Education & Expertise
  educationExpertise: {
    // Left column: Education
    education: {
      en: Array<{
        id: string
        degree: string // "MBA"
        detail: string // "Business in IT, University of Technology Sydney..."
      }>
      vi: Array<{
        id: string
        degree: string
        detail: string
      }>
    }

    // Right column: Current Focus
    currentFocus: {
      en: Array<{
        id: string
        focus: string // "AI learner and practitioner..."
      }>
      vi: Array<{
        id: string
        focus: string
      }>
    }
  }

  // Section 3: Training & Development
  training: {
    en: Array<{
      id: string
      name: string // "Leader as a Coach"
      issuer: string // "Samsung Vina"
      year?: string
    }>
    vi: Array<{
      id: string
      name: string
      issuer: string
      year?: string
    }>
  }

  // Section 4: Core Competencies
  competencies: {
    en: Array<{
      id: string
      competency: string // "Integrity", "Respect Others", etc.
    }>
    vi: Array<{
      id: string
      competency: string
    }>
  }

  // Section 5: Interests (renamed from Beyond Work)
  interests: {
    en: {
      bio: string // "Born March 9, 1975. Married, Vietnamese national..."
      hobbies: string // "Running, traveling, continuous learning..."
    }
    vi: {
      bio: string
      hobbies: string
    }
  }

  // Embeddings status (for chatbot)
  embeddings: {
    generated: boolean
    generatedAt?: number
    vectorCount?: number
  }
}

export interface Project {
  id: string // UUID
  slug: string // URL-friendly slug
  status: 'draft' | 'published'
  featured: boolean // Show on homepage?
  createdAt: number
  updatedAt: number
  publishedAt?: number // When status changed to published
  createdBy: string

  // Bilingual content
  en: {
    title: string // 3-100 chars
    description: string // 10-500 chars, short summary
    content: string // Markdown, detailed description
  }
  vi: {
    title: string
    description: string
    content: string // Markdown
  }

  // Project metadata
  techStack: string[] // ["Next.js", "TypeScript", "Tailwind CSS"]
  learnings: string[] // Key takeaways (2-5 items)
  githubUrl?: string // GitHub repo URL
  demoUrl?: string // Live demo URL
  featuredImage?: string // Main project image (Vercel Blob URL)
  screenshots: string[] // Max 5 additional images (Vercel Blob URLs)

  // Source (for regeneration)
  source?: {
    type: 'upload' | 'manual'
    rawContent?: string // Original extracted text
    fileName?: string // Original file name
  }
}

export interface BlogPost {
  id: string // UUID
  slug: string // URL-friendly slug
  status: 'draft' | 'published'
  featured: boolean // Show on homepage?
  createdAt: number
  updatedAt: number
  publishedAt?: number // When status changed to published
  createdBy: string

  // Bilingual content
  en: {
    title: string // 3-150 chars
    excerpt: string // 10-300 chars, short summary for cards
    content: string // Markdown
  }
  vi: {
    title: string
    excerpt: string
    content: string // Markdown
  }

  // Blog metadata
  category: string // Single category (user-created)
  tags: string[] // 1-10 tags
  featuredImage?: string // Vercel Blob URL
  readTime: number // Minutes (auto-calculated)

  // Source (for regeneration)
  source?: {
    rawDraft: string // Original pasted text
    detectedLanguage: 'en' | 'vi'
  }
}

export interface ContactMethod {
  id: string // UUID
  type: 'email' | 'phone' | 'linkedin' | 'github' | 'twitter' | 'website' | 'address' | 'custom'
  label: {
    en: string // "Work Email", "Mobile Phone"
    vi: string // "Email công việc", "Điện thoại di động"
  }
  value: string // actual email/phone/URL
  icon: string // lucide icon name: 'Mail', 'Phone', 'Linkedin', etc.
  order: number // for sorting (0, 1, 2, ...)
  visible: boolean // show/hide on public page
}

export interface ContactContent {
  methods: ContactMethod[] // array of contact methods
  updatedAt: number // timestamp
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
      post.readTime = calculateReadingTime(post.en.content)
    }

    await kv.set(`blog:${post.id}`, post)
    await kv.set(`blog:slug:${post.slug}`, post.id)

    // Auto-add category to categories list if new
    if (post.category) {
      await addBlogCategory(post.category)
    }
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
// Blog Categories
// ============================================

export async function getBlogCategories(): Promise<string[]> {
  try {
    const categories = await kv.get<string[]>('blog:categories')
    return categories || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function saveBlogCategories(categories: string[]): Promise<void> {
  try {
    await kv.set('blog:categories', categories)
  } catch (error) {
    console.error('Error saving categories:', error)
    throw error
  }
}

export async function addBlogCategory(category: string): Promise<void> {
  const categories = await getBlogCategories()
  if (!categories.includes(category)) {
    categories.push(category)
    await saveBlogCategories(categories)
  }
}

// ============================================
// Contact Content
// ============================================

export async function getContactContent(): Promise<ContactContent> {
  try {
    const data = await kv.get<ContactContent>('content:contact')
    if (!data) {
      return {
        methods: [],
        updatedAt: Date.now(),
      }
    }
    return data
  } catch (error) {
    console.error('Error fetching contact content:', error)
    return {
      methods: [],
      updatedAt: Date.now(),
    }
  }
}

export async function saveContactContent(content: ContactContent): Promise<void> {
  try {
    await kv.set('content:contact', {
      ...content,
      updatedAt: Date.now(),
    })
  } catch (error) {
    console.error('Error saving contact content:', error)
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
