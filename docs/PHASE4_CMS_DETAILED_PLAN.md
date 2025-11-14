# Phase 4: CMS Implementation - Detailed Plan

**Date**: January 14, 2025
**Status**: Ready for Implementation
**Estimated Time**: 5-7 hours
**Priority**: HIGH (enables content management without coding)

---

## 📋 Overview

Phase 4 implements a Content Management System (CMS) for managing About page, Projects, and Blog posts without touching code. All content will be stored in Vercel KV (Redis) and managed through an admin interface.

### Current State
- Content is hardcoded in TSX files
- No way to edit content without deploying code
- Bilingual support exists but content management is manual

### Target State
- All content stored in Vercel KV
- Admin UI for CRUD operations
- Bilingual content management (EN/VI)
- Rich text editor with Markdown support
- Image upload capability

---

## 🎯 Goals

1. **Content Management**: Create/Read/Update/Delete for About, Projects, Blog
2. **Admin UI**: User-friendly interface for content editing
3. **Bilingual Support**: Manage EN/VI content separately or with auto-translate
4. **Migration**: Move existing hardcoded content to KV
5. **Zero Downtime**: Seamless transition from hardcoded to KV-based content

---

## 📊 Content Models

### 1. About Content
```typescript
interface AboutContent {
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

  // Professional Journey (stays as-is, not editable for now)
  // Can add later if needed

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
```

### 2. Project
```typescript
interface Project {
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
```

### 3. Blog Post
```typescript
interface BlogPost {
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
  readingTime?: number // Auto-calculated
}
```

---

## 🏗️ Implementation Steps

### **Step 1: Content Manager Library** (30 mins)

Create `lib/contentManager.ts` for CRUD operations.

```typescript
// lib/contentManager.ts
import { kv } from '@vercel/kv'
import { v4 as uuidv4 } from 'uuid'

// About Content
export async function getAboutContent(): Promise<AboutContent | null> {
  return await kv.get<AboutContent>('content:about')
}

export async function saveAboutContent(content: AboutContent): Promise<void> {
  await kv.set('content:about', content)
}

// Projects
export async function getProject(id: string): Promise<Project | null> {
  return await kv.get<Project>(`project:${id}`)
}

export async function getAllProjects(): Promise<Project[]> {
  const keys = await kv.keys('project:*')
  const projects = await Promise.all(
    keys.map(key => kv.get<Project>(key))
  )
  return projects.filter(Boolean) as Project[]
}

export async function getPublishedProjects(): Promise<Project[]> {
  const all = await getAllProjects()
  return all
    .filter(p => p.status === 'published')
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function saveProject(project: Project): Promise<void> {
  await kv.set(`project:${project.id}`, project)

  // Update slug index for quick lookup
  await kv.set(`project:slug:${project.slug}`, project.id)
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const id = await kv.get<string>(`project:slug:${slug}`)
  if (!id) return null
  return await getProject(id)
}

export async function deleteProject(id: string): Promise<void> {
  const project = await getProject(id)
  if (project) {
    await kv.del(`project:${id}`)
    await kv.del(`project:slug:${project.slug}`)
  }
}

// Blog Posts (similar to Projects)
export async function getBlogPost(id: string): Promise<BlogPost | null> {
  return await kv.get<BlogPost>(`blog:${id}`)
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const keys = await kv.keys('blog:*')
  const posts = await Promise.all(
    keys.map(key => kv.get<BlogPost>(key))
  )
  return posts
    .filter(Boolean)
    .filter(p => !p.id.startsWith('slug:')) as BlogPost[]
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const all = await getAllBlogPosts()
  return all
    .filter(p => p.status === 'published')
    .sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt))
}

export async function saveBlogPost(post: BlogPost): Promise<void> {
  await kv.set(`blog:${post.id}`, post)
  await kv.set(`blog:slug:${post.slug}`, post.id)
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const id = await kv.get<string>(`blog:slug:${slug}`)
  if (!id) return null
  return await getBlogPost(id)
}

export async function deleteBlogPost(id: string): Promise<void> {
  const post = await getBlogPost(id)
  if (post) {
    await kv.del(`blog:${id}`)
    await kv.del(`blog:slug:${post.slug}`)
  }
}

// Utility: Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Utility: Calculate reading time
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}
```

**Testing:**
```bash
# Test file: lib/__tests__/contentManager.test.ts
npm test lib/contentManager
```

---

### **Step 2: API Routes** (45 mins)

Create API endpoints for CRUD operations.

#### 2.1 About API (`app/api/admin/content/about/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAboutContent, saveAboutContent } from '@/lib/contentManager'

// GET - Fetch about content
export async function GET() {
  const content = await getAboutContent()

  if (!content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  return NextResponse.json(content)
}

// PUT - Update about content (Admin only)
export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const content: AboutContent = {
    ...body,
    id: 'about',
    updatedAt: Date.now(),
    updatedBy: session.user.email || 'admin',
  }

  await saveAboutContent(content)

  return NextResponse.json({ success: true, content })
}
```

#### 2.2 Projects API (`app/api/admin/content/projects/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  getAllProjects,
  saveProject,
  deleteProject,
  generateSlug
} from '@/lib/contentManager'
import { v4 as uuidv4 } from 'uuid'

// GET - List all projects
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') // 'all' | 'published' | 'draft'

  let projects = await getAllProjects()

  if (status && status !== 'all') {
    projects = projects.filter(p => p.status === status)
  }

  return NextResponse.json(projects)
}

// POST - Create new project (Admin only)
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  const project: Project = {
    id: uuidv4(),
    slug: body.slug || generateSlug(body.en.title),
    status: body.status || 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: session.user.email || 'admin',
    en: body.en,
    vi: body.vi,
    tech: body.tech || [],
    image: body.image,
    github: body.github,
    demo: body.demo,
    featured: body.featured || false,
  }

  await saveProject(project)

  return NextResponse.json({ success: true, project }, { status: 201 })
}
```

#### 2.3 Single Project API (`app/api/admin/content/projects/[id]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProject, saveProject, deleteProject } from '@/lib/contentManager'

// GET - Fetch single project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json(project)
}

// PUT - Update project
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await getProject(params.id)
  if (!existing) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const body = await req.json()

  const project: Project = {
    ...existing,
    ...body,
    id: params.id,
    updatedAt: Date.now(),
  }

  await saveProject(project)

  return NextResponse.json({ success: true, project })
}

// DELETE - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await deleteProject(params.id)

  return NextResponse.json({ success: true })
}
```

#### 2.4 Blog API (Similar structure to Projects)

Create:
- `app/api/admin/content/blog/route.ts` - List & Create
- `app/api/admin/content/blog/[id]/route.ts` - Get, Update, Delete

**Testing:**
```bash
# Test with curl or Postman
curl http://localhost:3000/api/admin/content/projects
```

---

### **Step 3: Admin UI - Content List Pages** (1 hour)

#### 3.1 Projects Management (`app/admin/content/projects/page.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Project } from '@/lib/contentManager'

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    fetchProjects()
  }, [filter])

  async function fetchProjects() {
    setLoading(true)
    const res = await fetch(`/api/admin/content/projects?status=${filter}`)
    const data = await res.json()
    setProjects(data)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return

    await fetch(`/api/admin/content/projects/${id}`, { method: 'DELETE' })
    fetchProjects()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Projects</h1>
        <Link href="/admin/content/projects/new">
          <Button>+ New Project</Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
        >
          All ({projects.length})
        </button>
        <button
          onClick={() => setFilter('published')}
          className={`px-4 py-2 rounded ${filter === 'published' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
        >
          Published
        </button>
        <button
          onClick={() => setFilter('draft')}
          className={`px-4 py-2 rounded ${filter === 'draft' ? 'bg-primary-600 text-white' : 'bg-gray-100'}`}
        >
          Drafts
        </button>
      </div>

      {/* Projects table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title (EN)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{project.en.title}</div>
                    <div className="text-sm text-gray-500">{project.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <Link href={`/admin/content/projects/${project.id}`} className="text-primary-600 hover:text-primary-900 mr-4">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No projects found. Create your first project!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

#### 3.2 Blog Management (Similar to Projects)

Create: `app/admin/content/blog/page.tsx`

---

### **Step 4: Admin UI - Content Editor** (1.5 hours)

#### 4.1 Project Editor (`app/admin/content/projects/[id]/page.tsx`)

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Project } from '@/lib/contentManager'
import dynamic from 'next/dynamic'

// Import Markdown editor dynamically (client-side only)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function ProjectEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')

  const [formData, setFormData] = useState<Partial<Project>>({
    status: 'draft',
    en: { title: '', description: '', content: '' },
    vi: { title: '', description: '', content: '' },
    tech: [],
    featured: false,
  })

  useEffect(() => {
    if (!isNew) {
      fetchProject()
    }
  }, [params.id])

  async function fetchProject() {
    const res = await fetch(`/api/admin/content/projects/${params.id}`)
    const data = await res.json()
    setFormData(data)
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)

    const url = isNew
      ? '/api/admin/content/projects'
      : `/api/admin/content/projects/${params.id}`

    const method = isNew ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await res.json()

    if (data.success) {
      router.push('/admin/content/projects')
    }

    setSaving(false)
  }

  async function handleAutoTranslate() {
    // Call translation API (similar to video translation)
    const res = await fetch('/api/admin/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: formData.en,
        type: 'project'
      }),
    })

    const { translatedContent } = await res.json()

    setFormData({
      ...formData,
      vi: translatedContent,
    })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {isNew ? 'New Project' : 'Edit Project'}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Project'}
          </Button>
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('en')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'en'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          English
        </button>
        <button
          onClick={() => setActiveTab('vi')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'vi'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500'
          }`}
        >
          Tiếng Việt
        </button>
        {activeTab === 'vi' && (
          <button
            onClick={handleAutoTranslate}
            className="ml-auto text-sm text-primary-600 hover:text-primary-700"
          >
            🤖 Auto-translate from English
          </button>
        )}
      </div>

      {/* Content form */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Title ({activeTab.toUpperCase()})
          </label>
          <input
            type="text"
            value={formData[activeTab]?.title || ''}
            onChange={(e) => setFormData({
              ...formData,
              [activeTab]: {
                ...formData[activeTab],
                title: e.target.value,
              },
            })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
            placeholder="Enter project title..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description ({activeTab.toUpperCase()})
          </label>
          <textarea
            value={formData[activeTab]?.description || ''}
            onChange={(e) => setFormData({
              ...formData,
              [activeTab]: {
                ...formData[activeTab],
                description: e.target.value,
              },
            })}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-600"
            placeholder="Short description for cards and SEO..."
          />
        </div>

        {/* Content (Markdown) */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Content ({activeTab.toUpperCase()}) - Markdown
          </label>
          <MDEditor
            value={formData[activeTab]?.content || ''}
            onChange={(value) => setFormData({
              ...formData,
              [activeTab]: {
                ...formData[activeTab],
                content: value || '',
              },
            })}
            height={400}
          />
        </div>

        {/* Metadata (only show on EN tab) */}
        {activeTab === 'en' && (
          <>
            {/* Tech stack */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tech Stack (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tech?.join(', ') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  tech: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="React, TypeScript, Tailwind CSS"
              />
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">GitHub URL</label>
                <input
                  type="url"
                  value={formData.github || ''}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://github.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Demo URL</label>
                <input
                  type="url"
                  value={formData.demo || ''}
                  onChange={(e) => setFormData({ ...formData, demo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>

            {/* Status & Featured */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.status === 'published'}
                  onChange={(e) => setFormData({
                    ...formData,
                    status: e.target.checked ? 'published' : 'draft',
                  })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Publish (make visible on website)</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.featured || false}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Featured (show on homepage)</span>
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

#### 4.2 Blog Editor (Similar structure)

Create: `app/admin/content/blog/[id]/page.tsx`

#### 4.3 About Editor (Simplified version)

Create: `app/admin/content/about/page.tsx`

---

### **Step 5: Update Public Pages** (45 mins)

Modify public pages to fetch from KV instead of MDX files.

#### 5.1 Projects Page (`app/projects/page.tsx`)

```typescript
// Keep as server component for better SEO
import { ProjectCard } from '@/components/features/ProjectCard'
import { getPublishedProjects } from '@/lib/contentManager'
import { useLanguage } from '@/contexts/LanguageContext'

export default async function ProjectsPage() {
  const projects = await getPublishedProjects()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* ... existing UI ... */}
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}

// Add revalidation for ISR
export const revalidate = 60 // Revalidate every 60 seconds
```

#### 5.2 Project Detail Page (`app/projects/[slug]/page.tsx`)

```typescript
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getProjectBySlug, getPublishedProjects } from '@/lib/contentManager'

export async function generateStaticParams() {
  const projects = await getPublishedProjects()
  return projects.map((project) => ({
    slug: project.slug,
  }))
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug)

  if (!project || project.status !== 'published') {
    notFound()
  }

  // Render with client component for language switching
  return <ProjectDetailClient project={project} />
}

// Client component for language switching
'use client'
function ProjectDetailClient({ project }: { project: Project }) {
  const { language, t } = useLanguage()
  const content = project[language]

  return (
    <article>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <MDXRemote source={content.content} />
    </article>
  )
}

export const revalidate = 60
```

#### 5.3 Similar updates for Blog pages

---

### **Step 6: Migration Scripts** (30 mins)

Create scripts to migrate existing MDX content to KV.

#### 6.1 Migrate Projects (`scripts/migrate-projects-to-kv.ts`)

```typescript
import { getAllProjects, saveProject, generateSlug } from '@/lib/contentManager'
import { getContentByType } from '@/lib/mdx'
import { v4 as uuidv4 } from 'uuid'

async function migrateProjects() {
  console.log('🚀 Starting projects migration to KV...\n')

  // Get existing MDX projects
  const mdxProjects = getContentByType('projects')

  console.log(`Found ${mdxProjects.length} MDX projects\n`)

  for (const mdxProject of mdxProjects) {
    const project: Project = {
      id: uuidv4(),
      slug: mdxProject.slug,
      status: 'published',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'migration-script',
      en: {
        title: mdxProject.title,
        description: mdxProject.description,
        content: mdxProject.content,
      },
      vi: {
        title: '', // TODO: Translate manually or use auto-translate
        description: '',
        content: '',
      },
      tech: mdxProject.tech || [],
      image: mdxProject.image,
      github: mdxProject.github,
      demo: mdxProject.demo,
      featured: false,
    }

    await saveProject(project)
    console.log(`✅ Migrated: ${project.en.title}`)
  }

  console.log('\n✨ Migration complete!')
}

migrateProjects()
```

**Run migration:**
```bash
npx tsx scripts/migrate-projects-to-kv.ts
```

#### 6.2 Similar migration for Blog posts

---

### **Step 7: Admin Navigation** (15 mins)

Update admin sidebar to include CMS links.

```typescript
// components/admin/AdminSidebar.tsx
const adminNavItems = [
  // ... existing items ...
  {
    title: 'Content Management',
    items: [
      { label: 'About Page', href: '/admin/content/about', icon: UserIcon },
      { label: 'Projects', href: '/admin/content/projects', icon: FolderIcon },
      { label: 'Blog Posts', href: '/admin/content/blog', icon: DocumentIcon },
    ],
  },
]
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Create new project via admin UI
- [ ] Edit existing project
- [ ] Delete project
- [ ] Publish/unpublish project
- [ ] Auto-translate EN → VI
- [ ] View project on public site
- [ ] Same tests for blog posts
- [ ] Edit About page content
- [ ] Verify ISR revalidation (60 seconds)
- [ ] Test with both languages (EN/VI)

### Edge Cases
- [ ] Handle missing images gracefully
- [ ] Validate slug uniqueness
- [ ] Handle concurrent edits
- [ ] Test with very long content
- [ ] Test with special characters in title

---

## 📦 Dependencies

Need to install:

```bash
npm install uuid @types/uuid @uiw/react-md-editor
```

---

## 🚀 Deployment Steps

1. **Test locally first**
   ```bash
   npm run dev
   # Test all CRUD operations
   ```

2. **Run migration scripts**
   ```bash
   npx tsx scripts/migrate-projects-to-kv.ts
   npx tsx scripts/migrate-blog-to-kv.ts
   ```

3. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: implement Phase 4 - CMS for content management"
   git push origin main
   ```

4. **Deploy to production**
   ```bash
   npx vercel --prod
   ```

5. **Verify on production**
   - Test admin UI
   - Verify public pages load correctly
   - Check ISR revalidation

---

## ⚠️ Important Notes

### Performance
- Use ISR with 60-second revalidation for good balance
- KV lookups are fast (Redis)
- Consider pagination for large content lists

### Security
- All write operations require admin authentication
- Input validation on API routes
- Sanitize Markdown content before rendering

### Backward Compatibility
- Keep MDX files as backup
- Migration is one-way (MDX → KV)
- Can always re-import from MDX if needed

### Future Enhancements
- Image upload to Vercel Blob Storage
- Content versioning/history
- Content scheduling (publish at specific time)
- Content preview before publish
- Bulk operations (delete multiple)
- Search and filter in admin UI

---

## 🎯 Success Criteria

Phase 4 is complete when:
- ✅ Admin can create/edit/delete projects without code
- ✅ Admin can create/edit/delete blog posts without code
- ✅ Admin can edit About page content
- ✅ All content is bilingual (EN/VI)
- ✅ Public pages fetch from KV correctly
- ✅ ISR works properly (content updates within 60 seconds)
- ✅ Migration scripts tested and documented
- ✅ No TypeScript errors
- ✅ All tests pass

---

## 📅 Timeline

| Task | Time | Cumulative |
|------|------|-----------|
| Step 1: Content Manager Library | 30 mins | 0.5h |
| Step 2: API Routes | 45 mins | 1.25h |
| Step 3: Admin List Pages | 1 hour | 2.25h |
| Step 4: Admin Editors | 1.5 hours | 3.75h |
| Step 5: Update Public Pages | 45 mins | 4.5h |
| Step 6: Migration Scripts | 30 mins | 5h |
| Step 7: Admin Navigation | 15 mins | 5.25h |
| Testing & Fixes | 1 hour | 6.25h |
| **Total** | **~6-7 hours** | |

---

**Ready to implement Phase 4!** 🎉

This will give you full control over your website content without touching code. Perfect for a Product Manager! 😊
