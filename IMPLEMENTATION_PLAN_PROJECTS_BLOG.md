# 🚀 PROJECTS & BLOG IMPLEMENTATION PLAN

**Status:** Ready for Implementation
**Approved by:** User
**Start Date:** 2025-11-17

---

## 📊 EXECUTIVE SUMMARY

This document outlines the complete implementation plan for **Projects & Blog Management** features, following proven patterns from the existing **About Me** implementation.

**Key Decisions:**
- ✅ Categories: Option A (separate key in Vercel KV)
- ✅ Max 5 screenshots per project
- ✅ Option B: Store raw text only (no original file)
- ✅ Manual save (no auto-save)
- ✅ Image optimization: Yes
- ✅ Slug duplicates: Append number
- ✅ Reference About Me patterns extensively

---

## 🎯 PHASE 1: CORE INFRASTRUCTURE

**Duration:** 3-4 days
**Goal:** Set up data models, utilities, and reusable components

### 1.1 Update Data Models

**File:** `/lib/contentManager.ts`

**Expand Project Model:**
```typescript
export interface Project {
  // Core
  id: string                    // UUID
  slug: string                  // SEO-friendly, unique
  status: 'draft' | 'published'
  featured: boolean

  // Bilingual content
  en: {
    title: string               // 3-100 chars
    description: string         // 10-500 chars, short summary
    content: string             // Markdown, detailed description
  }
  vi: {
    title: string
    description: string
    content: string
  }

  // Metadata
  techStack: string[]           // ["Next.js", "TypeScript", ...]
  learnings: string[]           // Key takeaways (2-5 items)
  githubUrl?: string
  demoUrl?: string
  featuredImage?: string        // Main project image (Vercel Blob URL)
  screenshots: string[]         // Max 5 additional images (Vercel Blob URLs)

  // Source (for regeneration)
  source?: {
    type: 'upload' | 'manual'
    rawContent?: string         // Original extracted text
    fileName?: string           // Original file name
  }

  // Timestamps
  createdAt: number             // Unix timestamp
  updatedAt: number
  publishedAt?: number          // When status changed to published
  createdBy: string             // Admin email
}
```

**Expand BlogPost Model:**
```typescript
export interface BlogPost {
  // Core
  id: string
  slug: string
  status: 'draft' | 'published'
  featured: boolean

  // Bilingual content
  en: {
    title: string               // 3-150 chars
    excerpt: string             // 10-300 chars, short summary for cards
    content: string             // Markdown
  }
  vi: {
    title: string
    excerpt: string
    content: string
  }

  // Metadata
  category: string              // Single category (user-created)
  tags: string[]                // 1-10 tags
  featuredImage?: string        // Vercel Blob URL
  readTime: number              // Minutes (auto-calculated)

  // Source (for regeneration)
  source?: {
    rawDraft: string            // Original pasted text
    detectedLanguage: 'en' | 'vi'
  }

  // Timestamps
  createdAt: number
  updatedAt: number
  publishedAt?: number
  createdBy: string
}
```

**Add Category Storage:**
```typescript
// Storage in Vercel KV:
// Key: "blog:categories"
// Value: string[] (array of category names)

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
```

---

### 1.2 Create AI Parser Libraries

**File:** `/lib/projectParser.ts` (new, based on cvParser.ts)

```typescript
/**
 * Project Parser Library
 * Handles project document upload, text extraction, AI parsing, and translation
 */

import { getOpenAIClient } from './openai'
import { extractText } from 'unpdf'
import mammoth from 'mammoth'

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Extract text from PDF or DOCX file
 * (Reuse from cvParser.ts)
 */
export async function extractTextFromFile(
  fileUrl: string,
  fileName: string
): Promise<string> {
  // Same implementation as cvParser.ts
  // ... (copy from cvParser.ts lines 16-45)
}

/**
 * Detect language (EN or VI)
 * (Reuse from cvParser.ts)
 */
export async function detectLanguage(text: string): Promise<'en' | 'vi'> {
  // Same implementation as cvParser.ts
  // ... (copy from cvParser.ts lines 50-78)
}

/**
 * AI Parsing Prompt for Project Extraction
 */
const PROJECT_PARSING_PROMPT = `
You are a professional project documentation parser. Extract structured data from this project document in JSON format.

Extract the following information:

1. PROJECT TITLE
   - Concise, professional project name

2. SHORT DESCRIPTION
   - 1-2 sentences summarizing the project

3. DETAILED CONTENT
   - Full project description with:
     - Problem/Challenge
     - Solution/Approach
     - Implementation details
     - Results/Outcomes
   - Use Markdown formatting with proper headings (##, ###)
   - Use bullet points and code blocks where appropriate
   - Keep paragraphs concise (2-4 sentences)

4. TECH STACK
   - Array of technologies, frameworks, tools used
   - Examples: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI API"]

5. KEY LEARNINGS
   - 2-5 key takeaways or lessons learned
   - Each learning should be 1-2 sentences

Return JSON in this exact format:
{
  "title": "Project Name",
  "description": "Brief 1-2 sentence description",
  "content": "## Overview\\n\\nDetailed content in Markdown...",
  "techStack": ["Technology 1", "Technology 2", ...],
  "learnings": [
    "Learning 1: Brief description",
    "Learning 2: Brief description"
  ]
}

RULES:
- Keep descriptions concise and professional
- Use Markdown formatting for content (headings, bullets, code blocks)
- Extract actual tech stack (don't invent)
- Learnings should be specific and actionable
- If information is not found, use empty array [] or minimal placeholder
- Preserve technical accuracy

If the document is in English, also provide Vietnamese translation.
If the document is in Vietnamese, also provide English translation.

Return bilingual JSON:
{
  "en": { title, description, content, techStack, learnings },
  "vi": { title, description, content, techStack, learnings }
}
`

/**
 * Parse project document into structured data
 */
export async function parseProject(text: string, detectedLanguage: 'en' | 'vi') {
  try {
    const openai = getOpenAIClient()

    console.log(`[Project Parser] Parsing project (${detectedLanguage})...`)

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: PROJECT_PARSING_PROMPT,
        },
        {
          role: 'user',
          content: `Language: ${detectedLanguage}\n\n${text}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Slightly higher for better content generation
    })

    const parsed = JSON.parse(response.choices[0].message.content!)
    console.log('[Project Parser] ✅ Project parsed successfully')
    return parsed
  } catch (error) {
    console.error('[Project Parser] Parsing failed:', error)
    throw new Error(
      `Failed to parse project: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
```

**File:** `/lib/blogPolisher.ts` (new)

```typescript
/**
 * Blog Polisher Library
 * Handles blog draft polishing, structuring, and translation
 */

import { getOpenAIClient } from './openai'

const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Detect language from text
 */
export async function detectLanguage(text: string): Promise<'en' | 'vi'> {
  try {
    const openai = getOpenAIClient()

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'Detect if the text is in English or Vietnamese. Reply with only "en" or "vi".',
        },
        {
          role: 'user',
          content: text.substring(0, 1000),
        },
      ],
      temperature: 0,
    })

    const detected = response.choices[0].message.content?.trim().toLowerCase()
    return detected === 'vi' ? 'vi' : 'en'
  } catch (error) {
    console.error('[Blog Polisher] Language detection failed:', error)
    return 'en'
  }
}

/**
 * AI Prompt for Blog Polishing
 */
const BLOG_POLISHING_PROMPT = `
You are a professional blog editor and writing assistant. Your task is to polish a raw blog draft into a well-structured, engaging blog post.

Input: Raw blog draft in {{LANGUAGE}}

Tasks:
1. POLISH CONTENT:
   - Fix grammar, spelling, and punctuation errors
   - Improve sentence structure and flow
   - Add proper Markdown formatting:
     - Use ## for main headings, ### for subheadings
     - Use **bold** for emphasis
     - Use bullet points (-) or numbered lists (1.)
     - Use > for blockquotes
     - Use \`code\` for inline code, \`\`\`language for code blocks
   - Break long paragraphs (keep to 2-4 sentences each)
   - Preserve the author's voice and personality
   - Keep technical terms in English (API, database, etc.)

2. GENERATE TITLE:
   - Create a catchy, SEO-friendly title (50-60 characters)
   - Should be engaging and descriptive

3. GENERATE EXCERPT:
   - Write a compelling 2-3 sentence summary
   - Should make readers want to read more

4. EXTRACT TAGS:
   - Identify 3-5 relevant tags from the content
   - Use lowercase with hyphens (e.g., "product-management", "ai", "startup")

5. SUGGEST CATEGORY:
   - Suggest ONE category that best fits this post
   - Examples: "Product Management", "Engineering", "Personal Growth", "AI & Technology"

6. TRANSLATE:
   - If input is English → Translate to Vietnamese
   - If input is Vietnamese → Translate to English
   - Maintain the same structure and formatting

Return JSON in this exact format:
{
  "en": {
    "title": "Engaging Title in English",
    "excerpt": "Compelling 2-3 sentence summary in English.",
    "content": "## Main Heading\\n\\nPolished content in Markdown...",
    "tags": ["tag-1", "tag-2", "tag-3"],
    "category": "Suggested Category"
  },
  "vi": {
    "title": "Tiêu đề hấp dẫn bằng Tiếng Việt",
    "excerpt": "Tóm tắt 2-3 câu hấp dẫn bằng Tiếng Việt.",
    "content": "## Tiêu đề chính\\n\\nNội dung được chỉnh sửa bằng Markdown...",
    "tags": ["tag-1", "tag-2", "tag-3"],
    "category": "Danh mục đề xuất"
  }
}

STYLE RULES:
- Preserve author's authentic voice
- Professional but conversational tone
- Use minimal emojis (max 2 per section, only if appropriate)
- Keep paragraphs scannable (2-4 sentences)
- Use active voice
- Make content engaging and readable
`

/**
 * Polish blog draft with AI
 */
export async function polishBlog(rawDraft: string) {
  try {
    const openai = getOpenAIClient()

    // Detect language
    const detectedLanguage = await detectLanguage(rawDraft)
    console.log(`[Blog Polisher] Detected language: ${detectedLanguage}`)

    const prompt = BLOG_POLISHING_PROMPT.replace(
      '{{LANGUAGE}}',
      detectedLanguage === 'en' ? 'English' : 'Vietnamese'
    )

    console.log('[Blog Polisher] Polishing blog draft...')

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: rawDraft,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4, // Slightly creative for better writing
    })

    const polished = JSON.parse(response.choices[0].message.content!)
    console.log('[Blog Polisher] ✅ Blog polished successfully')

    return {
      ...polished,
      detectedLanguage,
    }
  } catch (error) {
    console.error('[Blog Polisher] Polishing failed:', error)
    throw new Error(
      `Failed to polish blog: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
```

---

### 1.3 Create Utility Functions

**File:** `/lib/utils.ts` (add to existing)

```typescript
import slugify from 'slugify'
import imageCompression from 'browser-image-compression'

/**
 * Generate SEO-friendly slug with Vietnamese support
 */
export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    locale: 'vi',  // Handle Vietnamese characters
    remove: /[*+~.()'"!:@]/g
  })
}

/**
 * Ensure slug is unique by checking against existing slugs
 * If duplicate, append number (e.g., my-project-2)
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

/**
 * Optimize image before upload (client-side)
 */
export async function optimizeImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Image optimization failed:', error)
    return file // Return original if optimization fails
  }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
```

---

### 1.4 Create Reusable Components

**File:** `/components/admin/BilingualTabs.tsx` (new)

```typescript
'use client'

interface BilingualTabsProps {
  activeTab: 'en' | 'vi'
  onChange: (tab: 'en' | 'vi') => void
}

export function BilingualTabs({ activeTab, onChange }: BilingualTabsProps) {
  return (
    <div className="border-b">
      <div className="flex px-6">
        <button
          onClick={() => onChange('en')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'en'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          English
        </button>
        <button
          onClick={() => onChange('vi')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'vi'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Tiếng Việt
        </button>
      </div>
    </div>
  )
}
```

**File:** `/components/admin/MarkdownEditor.tsx` (new)

```typescript
'use client'

import dynamic from 'next/dynamic'
import { ComponentProps } from 'react'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-slate-50 animate-pulse rounded-lg" />
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content in Markdown...',
  height = 400
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview="live"
        height={height}
        visibleDragbar={false}
        textareaProps={{
          placeholder,
        }}
      />
    </div>
  )
}
```

**File:** `/components/admin/ImageUploader.tsx` (new)

```typescript
'use client'

import { useState } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'
import { optimizeImage } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploaderProps {
  onUpload: (url: string) => void
  currentImage?: string
  onRemove?: () => void
  multiple?: boolean
  maxFiles?: number
  label?: string
}

export function ImageUploader({
  onUpload,
  currentImage,
  onRemove,
  multiple = false,
  maxFiles = 5,
  label = 'Upload Image'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (multiple && files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`)
          continue
        }

        // Validate file size (max 5MB before compression)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 5MB)`)
          continue
        }

        // Optimize image
        const optimizedFile = await optimizeImage(file)

        // Upload to API
        const formData = new FormData()
        formData.append('image', optimizedFile)

        const response = await fetch('/api/admin/upload/image', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const { url } = await response.json()
        onUpload(url)
        toast.success(`${file.name} uploaded successfully`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
        {label}
      </label>

      {/* Current Image Preview */}
      {currentImage && (
        <div className="mb-3 relative inline-block">
          <img
            src={currentImage}
            alt="Preview"
            className="w-48 h-32 object-cover rounded-lg border-2 border-slate-200"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Button */}
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileUpload}
        disabled={uploading}
        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer disabled:opacity-50"
      />

      {uploading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading and optimizing...
        </div>
      )}

      <p className="text-xs text-slate-500 mt-2">
        Recommended: {multiple ? `Up to ${maxFiles} images` : 'Single image'}, max 5MB each. Images will be optimized automatically.
      </p>
    </div>
  )
}
```

**File:** `/components/admin/StatusToggle.tsx` (new)

```typescript
'use client'

interface StatusToggleProps {
  status: 'draft' | 'published'
  onChange: (status: 'draft' | 'published') => void
  featured?: boolean
  onFeaturedChange?: (featured: boolean) => void
}

export function StatusToggle({
  status,
  onChange,
  featured,
  onFeaturedChange
}: StatusToggleProps) {
  return (
    <div className="flex items-center gap-6">
      {/* Status Toggle */}
      <div>
        <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => onChange(e.target.value as 'draft' | 'published')}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {/* Featured Checkbox */}
      {onFeaturedChange !== undefined && (
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase block mb-2">
            Featured
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => onFeaturedChange(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-slate-700">
              Show on homepage
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
```

---

## 🎯 PHASE 2: PROJECTS FEATURES

**Duration:** 5-6 days
**Goal:** Complete Projects upload, AI parsing, CRUD, and public pages

### 2.1 API Routes for Projects

**File:** `/app/api/admin/content/projects/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllProjects,
  saveProject,
  generateId,
  type Project
} from '@/lib/contentManager'
import { generateSlug, ensureUniqueSlug } from '@/lib/utils'

/**
 * GET /api/admin/content/projects
 * Get all projects with optional filters
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as 'draft' | 'published' | 'all'

    let projects = await getAllProjects()

    // Filter by status
    if (status && status !== 'all') {
      projects = projects.filter(p => p.status === status)
    }

    // Sort by updatedAt (newest first)
    projects.sort((a, b) => b.updatedAt - a.updatedAt)

    return NextResponse.json({
      success: true,
      projects,
      stats: {
        total: projects.length,
        draft: projects.filter(p => p.status === 'draft').length,
        published: projects.filter(p => p.status === 'published').length,
        featured: projects.filter(p => p.featured).length
      }
    })
  } catch (error) {
    console.error('Projects list error:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

/**
 * POST /api/admin/content/projects
 * Create new project
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Validation
    if (!body.en?.title || !body.vi?.title) {
      return NextResponse.json(
        { error: 'Title required in both languages' },
        { status: 400 }
      )
    }

    // Generate slug
    const baseSlug = generateSlug(body.en.title)
    const slug = await ensureUniqueSlug(
      baseSlug,
      async (s) => {
        const existing = await getProjectBySlug(s)
        return existing !== null
      }
    )

    const now = Date.now()
    const project: Project = {
      id: generateId(),
      slug,
      status: body.status || 'draft',
      featured: body.featured || false,
      en: {
        title: body.en.title,
        description: body.en.description || '',
        content: body.en.content || ''
      },
      vi: {
        title: body.vi.title,
        description: body.vi.description || '',
        content: body.vi.content || ''
      },
      techStack: body.techStack || [],
      learnings: body.learnings || [],
      githubUrl: body.githubUrl,
      demoUrl: body.demoUrl,
      featuredImage: body.featuredImage,
      screenshots: body.screenshots || [],
      source: body.source,
      createdAt: now,
      updatedAt: now,
      publishedAt: body.status === 'published' ? now : undefined,
      createdBy: session.user.email || 'admin'
    }

    await saveProject(project)

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
```

**File:** `/app/api/admin/content/projects/[id]/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getProject, saveProject, deleteProject } from '@/lib/contentManager'

/**
 * GET /api/admin/content/projects/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const project = await getProject(params.id)

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/content/projects/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const existing = await getProject(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await req.json()

    // Check if status changed to published
    const publishedAt =
      body.status === 'published' && existing.status !== 'published'
        ? Date.now()
        : existing.publishedAt

    const updated = {
      ...existing,
      ...body,
      id: params.id, // Ensure ID doesn't change
      updatedAt: Date.now(),
      publishedAt
    }

    await saveProject(updated)

    return NextResponse.json({ success: true, project: updated })
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/content/projects/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await deleteProject(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
```

**File:** `/app/api/admin/content/projects/upload/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'
import {
  extractTextFromFile,
  detectLanguage,
  parseProject,
} from '@/lib/projectParser'

/**
 * POST /api/admin/content/projects/upload
 * Upload project document (PDF/DOCX) and extract with AI
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Project Upload] Starting upload process...')

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    const fileName = file.name
    if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and DOCX are supported.' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    console.log(`[Project Upload] File: ${fileName}, Size: ${file.size} bytes`)

    // Upload to Vercel Blob (optional: for record keeping)
    console.log('[Project Upload] Uploading to Vercel Blob...')
    const blob = await put(`projects/${Date.now()}-${fileName}`, file, {
      access: 'public',
    })
    console.log(`[Project Upload] ✅ Uploaded to: ${blob.url}`)

    // Extract text
    console.log('[Project Upload] Extracting text...')
    const text = await extractTextFromFile(blob.url, fileName)

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: 'Failed to extract text from file. File may be empty or corrupted.' },
        { status: 400 }
      )
    }

    console.log(`[Project Upload] ✅ Extracted ${text.length} characters`)

    // Detect language
    console.log('[Project Upload] Detecting language...')
    const detectedLanguage = await detectLanguage(text)
    console.log(`[Project Upload] ✅ Detected language: ${detectedLanguage}`)

    // Parse with AI
    console.log('[Project Upload] Parsing project with AI...')
    const parsed = await parseProject(text, detectedLanguage)

    console.log('[Project Upload] ✅ Success! Project parsed.')

    return NextResponse.json({
      success: true,
      source: {
        type: 'upload',
        fileName,
        rawContent: text
      },
      parsedData: parsed,
      detectedLanguage
    })
  } catch (error) {
    console.error('[Project Upload] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    )
  }
}
```

**File:** `/app/api/admin/content/projects/regenerate/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseProject, detectLanguage } from '@/lib/projectParser'

/**
 * POST /api/admin/content/projects/regenerate
 * Regenerate project content from stored rawContent
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rawContent } = await req.json()

    if (!rawContent) {
      return NextResponse.json(
        { error: 'No source content to regenerate from' },
        { status: 400 }
      )
    }

    console.log('[Project Regenerate] Detecting language...')
    const detectedLanguage = await detectLanguage(rawContent)

    console.log('[Project Regenerate] Regenerating with AI...')
    const parsed = await parseProject(rawContent, detectedLanguage)

    console.log('[Project Regenerate] ✅ Regenerated successfully')

    return NextResponse.json({
      success: true,
      parsedData: parsed
    })
  } catch (error) {
    console.error('[Project Regenerate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate content' },
      { status: 500 }
    )
  }
}
```

**File:** `/app/api/admin/upload/image/route.ts` (new, shared for all image uploads)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'

/**
 * POST /api/admin/upload/image
 * General image upload endpoint
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'No image uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are supported.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const blob = await put(`images/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({
      success: true,
      url: blob.url
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
```

---

### 2.2 Admin Projects Pages

**File:** `/app/admin/content/projects/page.tsx` (new, list view)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Search, Filter, Loader2, Edit, Trash2, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import type { Project } from '@/lib/contentManager'

export default function ProjectsListPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [filter])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content/projects?status=${filter}`)
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects)
      }
    } catch (error) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/content/projects/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Project deleted')
        fetchProjects()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const filteredProjects = projects.filter(p =>
    p.en.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.vi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.techStack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Manage portfolio projects</p>
        </div>
        <Button onClick={() => router.push('/admin/content/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-1">
          {(['all', 'draft', 'published'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No projects found</p>
          <Button
            onClick={() => router.push('/admin/content/projects/new')}
            variant="outline"
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Tech Stack
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {project.featuredImage && (
                        <img
                          src={project.featuredImage}
                          alt={project.en.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{project.en.title}</p>
                        <p className="text-sm text-slate-500 truncate max-w-md">
                          {project.en.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          project.status === 'published'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {project.status}
                      </span>
                      {project.featured && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {project.status === 'published' && (
                        <button
                          onClick={() => window.open(`/projects/${project.slug}`, '_blank')}
                          className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/content/projects/${project.id}`)}
                        className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.en.title)}
                        className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

### Continuation Note:
This implementation plan document is getting very long. The remaining sections include:

- **2.3 Project Editor Page** (create/edit UI with all features)
- **2.4 Public Projects Pages** (list and detail pages)
- **Phase 3: Blog Features** (similar structure to Projects)
- **Phase 4: Polish & Optimization**
- **Testing Checklist**
- **Deployment Guide**

**Total estimated document length:** ~5000-6000 lines

Would you like me to:
1. **Continue writing the full plan in this document**
2. **Split into multiple files** (e.g., PHASE_2_PROJECTS.md, PHASE_3_BLOG.md)
3. **Provide high-level overview** and implement directly?

Let me know how you'd like to proceed!
