# CMS & Internationalization Implementation Plan
**Date**: November 14, 2025
**Status**: Planning Phase
**Implementation**: To be done by Claude Code Web on GitHub

---

## 🎯 Overview

This document outlines the detailed implementation plan for two major features:
1. **CMS (Content Management System)** using Vercel KV for About/Projects/Blog pages
2. **i18n (Internationalization)** for Vietnamese content translation

**Key Decisions**:
- ✅ CMS: Vercel KV-based (Option 1)
- ✅ i18n: Content-only (UI + Page content, no Admin translation needed)
- ✅ Target: Vietnamese-speaking users can read and understand content

---

## 📦 Part 1: CMS Implementation (Vercel KV-based)

### Architecture Overview

```
Current State (Hardcoded):
app/about/page.tsx          → Hardcoded content
app/projects/[slug]/page.tsx → Hardcoded projects
app/blog/[slug]/page.tsx    → Hardcoded blog posts

New State (Dynamic from KV):
Vercel KV (Redis)
├── content:about           → About page content (Markdown + metadata)
├── content:project:{slug}  → Individual projects
├── content:blog:{slug}     → Individual blog posts
└── content:stats           → Content statistics

Admin Panel
├── /admin/content/about    → Edit About page
├── /admin/content/projects → Manage projects (CRUD)
└── /admin/content/blog     → Manage blog posts (CRUD)
```

---

### 1.1 Data Models

#### About Page Content
```typescript
// lib/contentManager.ts

export interface AboutContent {
  version: number              // Version number for tracking changes
  title: string               // Page title
  content: string             // Main content in Markdown format
  sections: AboutSection[]    // Structured sections
  skills: string[]           // List of skills
  experience: ExperienceItem[] // Work experience
  education: EducationItem[]  // Education history
  lastUpdated: number        // Unix timestamp
  updatedBy: string          // Admin email
}

export interface AboutSection {
  heading: string
  content: string  // Markdown
  order: number
}

export interface ExperienceItem {
  company: string
  position: string
  duration: string
  description: string
  technologies?: string[]
}

export interface EducationItem {
  institution: string
  degree: string
  duration: string
  description?: string
}

// Storage key: "content:about"
```

#### Project
```typescript
export interface Project {
  slug: string               // URL-friendly identifier
  title: string             // Project name
  shortDescription: string  // Brief description (1-2 sentences)
  fullDescription: string   // Detailed description (Markdown)

  // Media
  thumbnailUrl: string      // Main project image
  images?: string[]         // Additional screenshots

  // Technical details
  technologies: string[]    // Tech stack
  category: ProjectCategory // 'web' | 'mobile' | 'ai' | 'other'

  // Links
  githubUrl?: string
  liveUrl?: string
  demoUrl?: string

  // Metadata
  featured: boolean         // Show on homepage
  status: 'active' | 'completed' | 'archived'
  startDate: string        // YYYY-MM
  endDate?: string         // YYYY-MM or null if ongoing

  // Content
  challenges?: string      // Markdown - challenges faced
  solutions?: string       // Markdown - how they were solved
  results?: string         // Markdown - outcomes/impact

  // SEO
  metaDescription?: string
  tags: string[]

  // Timestamps
  createdAt: number
  updatedAt: number
  createdBy: string
}

export type ProjectCategory = 'web' | 'mobile' | 'ai' | 'automation' | 'other'

// Storage keys:
// - "content:project:{slug}" - Individual project
// - "content:projects:all" - Set of all project slugs
// - "content:projects:featured" - Set of featured project slugs
```

#### Blog Post
```typescript
export interface BlogPost {
  slug: string              // URL-friendly identifier
  title: string            // Post title
  excerpt: string          // Short summary (2-3 sentences)
  content: string          // Full post content (Markdown)

  // Media
  coverImage?: string      // Featured image

  // Categorization
  category: BlogCategory   // Main category
  tags: string[]          // Related tags

  // Author
  author: {
    name: string
    email: string
    avatar?: string
  }

  // Publishing
  status: 'draft' | 'published' | 'archived'
  publishedAt: number     // Unix timestamp
  scheduledFor?: number   // Future publish date

  // Engagement
  featured: boolean       // Show on homepage/featured section
  readingTime?: number    // Estimated minutes

  // SEO
  metaDescription?: string
  ogImage?: string

  // Timestamps
  createdAt: number
  updatedAt: number
  createdBy: string
}

export type BlogCategory =
  | 'technology'
  | 'ai-ml'
  | 'web-development'
  | 'career'
  | 'personal'
  | 'tutorials'

// Storage keys:
// - "content:blog:{slug}" - Individual post
// - "content:blogs:all" - Sorted set (score = publishedAt)
// - "content:blogs:featured" - Set of featured post slugs
// - "content:blogs:category:{category}" - Posts by category
```

---

### 1.2 Core Functions

```typescript
// lib/contentManager.ts

/**
 * ABOUT PAGE
 */
export async function getAboutContent(): Promise<AboutContent | null> {
  return await kv.get<AboutContent>('content:about')
}

export async function updateAboutContent(
  content: AboutContent,
  userEmail: string
): Promise<void> {
  content.lastUpdated = Date.now()
  content.updatedBy = userEmail
  await kv.set('content:about', content)
}

/**
 * PROJECTS
 */
export async function getAllProjects(): Promise<Project[]> {
  const slugs = await kv.smembers('content:projects:all')
  const projects: Project[] = []

  for (const slug of slugs) {
    const project = await kv.get<Project>(`content:project:${slug}`)
    if (project && project.status !== 'archived') {
      projects.push(project)
    }
  }

  // Sort by updatedAt desc
  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const slugs = await kv.smembers('content:projects:featured')
  const projects: Project[] = []

  for (const slug of slugs) {
    const project = await kv.get<Project>(`content:project:${slug}`)
    if (project && project.featured && project.status === 'active') {
      projects.push(project)
    }
  }

  return projects.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getProject(slug: string): Promise<Project | null> {
  return await kv.get<Project>(`content:project:${slug}`)
}

export async function saveProject(project: Project, userEmail: string): Promise<void> {
  const now = Date.now()
  const isNew = !project.createdAt

  project.updatedAt = now
  if (isNew) {
    project.createdAt = now
    project.createdBy = userEmail
  }

  // Save project
  await kv.set(`content:project:${project.slug}`, project)

  // Add to all projects set
  await kv.sadd('content:projects:all', project.slug)

  // Manage featured set
  if (project.featured) {
    await kv.sadd('content:projects:featured', project.slug)
  } else {
    await kv.srem('content:projects:featured', project.slug)
  }
}

export async function deleteProject(slug: string): Promise<void> {
  await kv.del(`content:project:${slug}`)
  await kv.srem('content:projects:all', slug)
  await kv.srem('content:projects:featured', slug)
}

/**
 * BLOG POSTS
 */
export async function getAllBlogPosts(
  limit: number = 50,
  offset: number = 0
): Promise<BlogPost[]> {
  // Get from sorted set (sorted by publishedAt)
  const slugs = await kv.zrange('content:blogs:all', offset, offset + limit - 1, {
    rev: true
  })

  const posts: BlogPost[] = []
  for (const slug of slugs) {
    const post = await kv.get<BlogPost>(`content:blog:${slug}`)
    if (post && post.status === 'published') {
      posts.push(post)
    }
  }

  return posts
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  const slugs = await kv.smembers('content:blogs:featured')
  const posts: BlogPost[] = []

  for (const slug of slugs) {
    const post = await kv.get<BlogPost>(`content:blog:${slug}`)
    if (post && post.featured && post.status === 'published') {
      posts.push(post)
    }
  }

  return posts.sort((a, b) => b.publishedAt - a.publishedAt)
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return await kv.get<BlogPost>(`content:blog:${slug}`)
}

export async function saveBlogPost(post: BlogPost, userEmail: string): Promise<void> {
  const now = Date.now()
  const isNew = !post.createdAt

  post.updatedAt = now
  if (isNew) {
    post.createdAt = now
    post.createdBy = userEmail
  }

  // Auto-publish if scheduled time passed
  if (post.scheduledFor && post.scheduledFor <= now && post.status === 'draft') {
    post.status = 'published'
    post.publishedAt = now
  }

  // Save post
  await kv.set(`content:blog:${post.slug}`, post)

  // Add to sorted set (score = publishedAt)
  if (post.status === 'published') {
    await kv.zadd('content:blogs:all', {
      score: post.publishedAt,
      member: post.slug
    })

    // Category index
    if (post.category) {
      await kv.sadd(`content:blogs:category:${post.category}`, post.slug)
    }
  }

  // Manage featured set
  if (post.featured && post.status === 'published') {
    await kv.sadd('content:blogs:featured', post.slug)
  } else {
    await kv.srem('content:blogs:featured', post.slug)
  }
}

export async function deleteBlogPost(slug: string): Promise<void> {
  const post = await getBlogPost(slug)

  await kv.del(`content:blog:${slug}`)
  await kv.zrem('content:blogs:all', slug)
  await kv.srem('content:blogs:featured', slug)

  if (post?.category) {
    await kv.srem(`content:blogs:category:${post.category}`, slug)
  }
}

/**
 * STATISTICS
 */
export async function getContentStats() {
  const [projectsCount, blogsCount, featuredProjects, featuredBlogs] = await Promise.all([
    kv.scard('content:projects:all'),
    kv.zcard('content:blogs:all'),
    kv.scard('content:projects:featured'),
    kv.scard('content:blogs:featured'),
  ])

  return {
    projects: {
      total: projectsCount || 0,
      featured: featuredProjects || 0,
    },
    blogs: {
      total: blogsCount || 0,
      featured: featuredBlogs || 0,
    },
  }
}
```

---

### 1.3 API Routes

```typescript
// app/api/admin/content/about/route.ts
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const content = await getAboutContent()
  return NextResponse.json({ success: true, content })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  await updateAboutContent(body, session.user.email)
  return NextResponse.json({ success: true })
}

// app/api/admin/content/projects/route.ts
// GET: List all projects (including drafts)
// POST: Create new project

// app/api/admin/content/projects/[slug]/route.ts
// GET: Get single project
// PUT: Update project
// DELETE: Delete project

// app/api/admin/content/blogs/route.ts
// GET: List all posts (including drafts)
// POST: Create new post

// app/api/admin/content/blogs/[slug]/route.ts
// GET: Get single post
// PUT: Update post
// DELETE: Delete post
```

---

### 1.4 Admin UI Components

```typescript
// app/admin/content/about/page.tsx
// - Rich Markdown editor (react-markdown-editor-lite or similar)
// - Preview mode
// - Save button
// - Version history (if needed)

// app/admin/content/projects/page.tsx
// - Table list of projects
// - Create new button
// - Edit/Delete actions
// - Featured toggle
// - Status filter (active/completed/archived)

// app/admin/content/projects/new/page.tsx
// app/admin/content/projects/[slug]/edit/page.tsx
// - Form with all project fields
// - Markdown editor for descriptions
// - Image upload (Vercel Blob)
// - Technology tags selector
// - URL inputs
// - Preview mode

// app/admin/content/blog/page.tsx
// - Table list of posts
// - Create new button
// - Edit/Delete actions
// - Status filter (draft/published/archived)
// - Featured toggle

// app/admin/content/blog/new/page.tsx
// app/admin/content/blog/[slug]/edit/page.tsx
// - Form with all post fields
// - Rich Markdown editor
// - Cover image upload
// - Category/tags selector
// - Publish/Schedule controls
// - Preview mode
```

---

### 1.5 Migration Plan

**Step 1**: Extract existing content to JSON/Markdown
```bash
# Create migration script
node scripts/migrate-content-to-kv.js

# Extract:
# - app/about/page.tsx → about.json
# - app/projects/[slug]/page.tsx → projects/*.json
# - app/blog/[slug]/page.tsx → blog/*.json
```

**Step 2**: Seed Vercel KV with initial data
```typescript
// scripts/seed-content.ts
import { saveProject, saveBlogPost, updateAboutContent } from '@/lib/contentManager'

// Load JSON files and save to KV
```

**Step 3**: Update pages to fetch from KV
```typescript
// app/about/page.tsx
import { getAboutContent } from '@/lib/contentManager'

export default async function AboutPage() {
  const content = await getAboutContent()
  // Render content
}
```

**Step 4**: Build admin UI

**Step 5**: Test and verify

---

## 🌐 Part 2: Internationalization (i18n)

### Architecture Overview

```
next-intl Integration
├── /messages
│   ├── en.json         → English translations
│   └── vi.json         → Vietnamese translations
├── middleware.ts       → Detect and redirect based on locale
└── i18n.ts            → next-intl configuration

URL Structure:
https://hungreo.vercel.app/          → English (default)
https://hungreo.vercel.app/vi/       → Vietnamese
https://hungreo.vercel.app/vi/about  → Vietnamese About page

Language Switcher:
- Header dropdown: EN | VI
- Cookie/localStorage preference
- Auto-detect from browser (Accept-Language)
```

---

### 2.1 Setup next-intl

```bash
npm install next-intl
```

```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}))

// middleware.ts
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'vi'],
  defaultLocale: 'en',
  localePrefix: 'as-needed' // /en prefix not shown, /vi prefix shown
})

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
```

---

### 2.2 Translation Structure

#### UI Translations (Common across all pages)

```json
// messages/en.json
{
  "header": {
    "home": "Home",
    "about": "About",
    "projects": "Projects",
    "blog": "Blog",
    "aiTools": "AI Tools",
    "contact": "Contact"
  },
  "footer": {
    "copyright": "© {year} Hung Dinh. All rights reserved.",
    "securityText": "Secured with HTTPS | GDPR Compliant | No Tracking",
    "learnMore": "Learn More",
    "email": "Email",
    "security": "Security"
  },
  "common": {
    "readMore": "Read more",
    "viewProject": "View Project",
    "liveDemo": "Live Demo",
    "sourceCode": "Source Code",
    "loading": "Loading...",
    "error": "Error",
    "tryAgain": "Try Again",
    "back": "Back",
    "next": "Next",
    "previous": "Previous"
  },
  "knowledge": {
    "title": "AI Tools - Video Library",
    "subtitle": "Explore curated videos organized by category. Each video includes AI-powered summaries and an intelligent chatbot to help you understand the content better.",
    "categories": {
      "leadership": "Leadership",
      "aiWorks": "AI Works",
      "health": "Health",
      "entertaining": "Entertaining",
      "philosophy": "Human Philosophy"
    },
    "categoryDescriptions": {
      "leadership": "Learn from great leaders about vision, motivation, and inspiring teams",
      "aiWorks": "Explore artificial intelligence, machine learning, and the future of technology",
      "health": "Discover insights on physical and mental well-being, fitness, and nutrition",
      "entertaining": "Enjoy thought-provoking entertainment, comedy, and creative content",
      "philosophy": "Dive into philosophical questions about life, meaning, and human nature"
    },
    "videoCount": "{count, plural, =0 {No videos} =1 {1 video} other {{count} videos}}",
    "browseVideos": "Browse videos",
    "howItWorks": "How it works",
    "steps": {
      "browse": "Browse videos by category: Leadership, AI Works, Health, Entertaining, or Human Philosophy",
      "transcript": "Each video page includes the full transcript and an AI chatbot",
      "askQuestions": "Ask questions about the video content and get instant, context-aware answers"
    }
  },
  "projects": {
    "title": "Projects",
    "subtitle": "Explore my portfolio of projects",
    "featured": "Featured Projects",
    "allProjects": "All Projects",
    "technologies": "Technologies",
    "status": {
      "active": "Active",
      "completed": "Completed",
      "archived": "Archived"
    },
    "viewDetails": "View Details",
    "challenges": "Challenges",
    "solutions": "Solutions",
    "results": "Results"
  },
  "blog": {
    "title": "Blog",
    "subtitle": "Thoughts, tutorials, and insights",
    "featured": "Featured Posts",
    "allPosts": "All Posts",
    "readingTime": "{minutes} min read",
    "publishedOn": "Published on {date}",
    "categories": {
      "technology": "Technology",
      "aiMl": "AI & Machine Learning",
      "webDevelopment": "Web Development",
      "career": "Career",
      "personal": "Personal",
      "tutorials": "Tutorials"
    },
    "tags": "Tags",
    "relatedPosts": "Related Posts"
  },
  "about": {
    "title": "About Me",
    "skills": "Skills",
    "experience": "Experience",
    "education": "Education",
    "contact": "Get in Touch"
  },
  "contact": {
    "title": "Contact",
    "subtitle": "Let's work together",
    "name": "Name",
    "email": "Email",
    "message": "Message",
    "send": "Send Message",
    "success": "Message sent successfully!",
    "error": "Failed to send message. Please try again."
  },
  "chatbot": {
    "title": "AI Assistant",
    "placeholder": "Ask me anything...",
    "send": "Send",
    "thinking": "Thinking...",
    "error": "Sorry, I encountered an error. Please try again.",
    "welcome": "Hi! I'm your AI assistant. How can I help you today?"
  }
}

// messages/vi.json
{
  "header": {
    "home": "Trang chủ",
    "about": "Giới thiệu",
    "projects": "Dự án",
    "blog": "Blog",
    "aiTools": "Công cụ AI",
    "contact": "Liên hệ"
  },
  "footer": {
    "copyright": "© {year} Hung Dinh. Bảo lưu mọi quyền.",
    "securityText": "Bảo mật HTTPS | Tuân thủ GDPR | Không theo dõi",
    "learnMore": "Tìm hiểu thêm",
    "email": "Email",
    "security": "Bảo mật"
  },
  "common": {
    "readMore": "Đọc thêm",
    "viewProject": "Xem dự án",
    "liveDemo": "Demo trực tiếp",
    "sourceCode": "Mã nguồn",
    "loading": "Đang tải...",
    "error": "Lỗi",
    "tryAgain": "Thử lại",
    "back": "Quay lại",
    "next": "Tiếp theo",
    "previous": "Trước đó"
  },
  "knowledge": {
    "title": "Công cụ AI - Thư viện Video",
    "subtitle": "Khám phá các video được tuyển chọn theo danh mục. Mỗi video bao gồm tóm tắt AI và chatbot thông minh giúp bạn hiểu nội dung tốt hơn.",
    "categories": {
      "leadership": "Lãnh đạo",
      "aiWorks": "AI & Công nghệ",
      "health": "Sức khỏe",
      "entertaining": "Giải trí",
      "philosophy": "Triết học con người"
    },
    "categoryDescriptions": {
      "leadership": "Học hỏi từ các nhà lãnh đạo vĩ đại về tầm nhìn, động lực và truyền cảm hứng",
      "aiWorks": "Khám phá trí tuệ nhân tạo, học máy và tương lai của công nghệ",
      "health": "Khám phá hiểu biết về sức khỏe thể chất, tinh thần, thể dục và dinh dưỡng",
      "entertaining": "Thưởng thức nội dung giải trí sâu sắc, hài hước và sáng tạo",
      "philosophy": "Đào sâu vào các câu hỏi triết học về cuộc sống, ý nghĩa và bản chất con người"
    },
    "videoCount": "{count, plural, =0 {Chưa có video} =1 {1 video} other {{count} video}}",
    "browseVideos": "Duyệt video",
    "howItWorks": "Cách hoạt động",
    "steps": {
      "browse": "Duyệt video theo danh mục: Lãnh đạo, AI & Công nghệ, Sức khỏe, Giải trí, hoặc Triết học",
      "transcript": "Mỗi trang video bao gồm bản ghi đầy đủ và chatbot AI",
      "askQuestions": "Đặt câu hỏi về nội dung video và nhận câu trả lời ngay lập tức dựa trên ngữ cảnh"
    }
  },
  "projects": {
    "title": "Dự án",
    "subtitle": "Khám phá danh mục dự án của tôi",
    "featured": "Dự án nổi bật",
    "allProjects": "Tất cả dự án",
    "technologies": "Công nghệ",
    "status": {
      "active": "Đang hoạt động",
      "completed": "Hoàn thành",
      "archived": "Lưu trữ"
    },
    "viewDetails": "Xem chi tiết",
    "challenges": "Thách thức",
    "solutions": "Giải pháp",
    "results": "Kết quả"
  },
  "blog": {
    "title": "Blog",
    "subtitle": "Suy nghĩ, hướng dẫn và kiến thức",
    "featured": "Bài viết nổi bật",
    "allPosts": "Tất cả bài viết",
    "readingTime": "{minutes} phút đọc",
    "publishedOn": "Xuất bản ngày {date}",
    "categories": {
      "technology": "Công nghệ",
      "aiMl": "AI & Học máy",
      "webDevelopment": "Phát triển Web",
      "career": "Sự nghiệp",
      "personal": "Cá nhân",
      "tutorials": "Hướng dẫn"
    },
    "tags": "Thẻ",
    "relatedPosts": "Bài viết liên quan"
  },
  "about": {
    "title": "Giới thiệu",
    "skills": "Kỹ năng",
    "experience": "Kinh nghiệm",
    "education": "Học vấn",
    "contact": "Liên hệ"
  },
  "contact": {
    "title": "Liên hệ",
    "subtitle": "Hãy cùng làm việc",
    "name": "Tên",
    "email": "Email",
    "message": "Tin nhắn",
    "send": "Gửi tin nhắn",
    "success": "Tin nhắn đã được gửi thành công!",
    "error": "Không thể gửi tin nhắn. Vui lòng thử lại."
  },
  "chatbot": {
    "title": "Trợ lý AI",
    "placeholder": "Hỏi tôi bất cứ điều gì...",
    "send": "Gửi",
    "thinking": "Đang suy nghĩ...",
    "error": "Xin lỗi, tôi gặp lỗi. Vui lòng thử lại.",
    "welcome": "Xin chào! Tôi là trợ lý AI của bạn. Tôi có thể giúp gì cho bạn hôm nay?"
  }
}
```

---

### 2.3 Content Translation (Dynamic from KV)

**Strategy**: Store content in BOTH languages in Vercel KV

```typescript
// Updated data models with i18n support

export interface AboutContent {
  version: number

  // English content
  en: {
    title: string
    content: string
    sections: AboutSection[]
    skills: string[]
    experience: ExperienceItem[]
    education: EducationItem[]
  }

  // Vietnamese content
  vi: {
    title: string
    content: string
    sections: AboutSection[]
    skills: string[]
    experience: ExperienceItem[]
    education: EducationItem[]
  }

  lastUpdated: number
  updatedBy: string
}

export interface Project {
  slug: string

  // English content
  en: {
    title: string
    shortDescription: string
    fullDescription: string
    challenges?: string
    solutions?: string
    results?: string
    metaDescription?: string
  }

  // Vietnamese content
  vi: {
    title: string
    shortDescription: string
    fullDescription: string
    challenges?: string
    solutions?: string
    results?: string
    metaDescription?: string
  }

  // Language-agnostic fields
  thumbnailUrl: string
  images?: string[]
  technologies: string[]
  category: ProjectCategory
  githubUrl?: string
  liveUrl?: string
  featured: boolean
  status: 'active' | 'completed' | 'archived'
  startDate: string
  endDate?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  createdBy: string
}

export interface BlogPost {
  slug: string

  // English content
  en: {
    title: string
    excerpt: string
    content: string
    metaDescription?: string
  }

  // Vietnamese content
  vi: {
    title: string
    excerpt: string
    content: string
    metaDescription?: string
  }

  // Language-agnostic fields
  coverImage?: string
  category: BlogCategory
  tags: string[]
  author: { name: string; email: string; avatar?: string }
  status: 'draft' | 'published' | 'archived'
  publishedAt: number
  featured: boolean
  readingTime?: number
  createdAt: number
  updatedAt: number
  createdBy: string
}
```

---

### 2.4 Usage in Components

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

// components/Header.tsx
'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export function Header() {
  const t = useTranslations('header')
  const params = useParams()
  const locale = params.locale as string

  return (
    <header>
      <nav>
        <Link href={`/${locale}`}>{t('home')}</Link>
        <Link href={`/${locale}/about`}>{t('about')}</Link>
        <Link href={`/${locale}/projects`}>{t('projects')}</Link>
        <Link href={`/${locale}/blog`}>{t('blog')}</Link>
        <Link href={`/${locale}/tools/knowledge`}>{t('aiTools')}</Link>
        <Link href={`/${locale}/contact`}>{t('contact')}</Link>
      </nav>

      <LanguageSwitcher />
    </header>
  )
}

// components/LanguageSwitcher.tsx
'use client'

import { useParams, useRouter, usePathname } from 'next/navigation'

export function LanguageSwitcher() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentLocale = params.locale as string

  const switchLocale = (newLocale: string) => {
    // Replace locale in pathname
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => switchLocale('en')}
        className={currentLocale === 'en' ? 'font-bold' : ''}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('vi')}
        className={currentLocale === 'vi' ? 'font-bold' : ''}
      >
        VI
      </button>
    </div>
  )
}

// app/[locale]/about/page.tsx
import { getAboutContent } from '@/lib/contentManager'
import { useTranslations } from 'next-intl'

export default async function AboutPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const content = await getAboutContent()
  const t = useTranslations('about')

  // Get content for current locale
  const localizedContent = content?.[locale as 'en' | 'vi']

  return (
    <div>
      <h1>{t('title')}</h1>
      <h2>{localizedContent?.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: localizedContent?.content }} />

      <h3>{t('skills')}</h3>
      <ul>
        {localizedContent?.skills.map(skill => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>

      {/* ... */}
    </div>
  )
}
```

---

### 2.5 SEO & Metadata

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return {
    title: locale === 'vi' ? 'Hung Dinh - Nhà phát triển Full Stack' : 'Hung Dinh - Full Stack Developer',
    description: locale === 'vi'
      ? 'Portfolio và blog cá nhân của Hung Dinh. Chuyên về phát triển web, AI và machine learning.'
      : 'Personal portfolio and blog of Hung Dinh. Specialized in web development, AI, and machine learning.',
    alternates: {
      canonical: `https://hungreo.vercel.app/${locale}`,
      languages: {
        en: 'https://hungreo.vercel.app/en',
        vi: 'https://hungreo.vercel.app/vi',
      }
    }
  }
}
```

---

### 2.6 Admin UI for i18n Content

```typescript
// app/admin/content/projects/[slug]/edit/page.tsx

export default function EditProjectPage() {
  const [activeTab, setActiveTab] = useState<'en' | 'vi'>('en')

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="vi">Tiếng Việt</TabsTrigger>
        </TabsList>

        <TabsContent value="en">
          {/* English form fields */}
          <input name="en.title" placeholder="Title (English)" />
          <textarea name="en.shortDescription" placeholder="Short Description (English)" />
          <MarkdownEditor name="en.fullDescription" />
          {/* ... */}
        </TabsContent>

        <TabsContent value="vi">
          {/* Vietnamese form fields */}
          <input name="vi.title" placeholder="Tiêu đề (Tiếng Việt)" />
          <textarea name="vi.shortDescription" placeholder="Mô tả ngắn (Tiếng Việt)" />
          <MarkdownEditor name="vi.fullDescription" />
          {/* ... */}
        </TabsContent>
      </Tabs>

      {/* Language-agnostic fields */}
      <input name="thumbnailUrl" placeholder="Thumbnail URL" />
      <input name="githubUrl" placeholder="GitHub URL" />
      {/* ... */}
    </div>
  )
}
```

---

## 📋 Implementation Checklist

### CMS Implementation
- [ ] Create `lib/contentManager.ts` with all data models
- [ ] Implement core CRUD functions for About/Projects/Blog
- [ ] Create API routes (`/api/admin/content/*`)
- [ ] Build admin UI pages
  - [ ] About editor
  - [ ] Projects manager (list + edit)
  - [ ] Blog manager (list + edit)
- [ ] Create migration script to extract existing content
- [ ] Seed Vercel KV with initial data
- [ ] Update public pages to fetch from KV
  - [ ] `/about`
  - [ ] `/projects`
  - [ ] `/projects/[slug]`
  - [ ] `/blog`
  - [ ] `/blog/[slug]`
- [ ] Test CRUD operations
- [ ] Add ISR revalidation (60s)

### i18n Implementation
- [ ] Install `next-intl`
- [ ] Setup `i18n.ts` and `middleware.ts`
- [ ] Create translation files
  - [ ] `messages/en.json`
  - [ ] `messages/vi.json`
- [ ] Restructure app directory
  - [ ] Move pages to `app/[locale]/`
  - [ ] Update imports and routing
- [ ] Update data models for i18n content
- [ ] Implement `LanguageSwitcher` component
- [ ] Update all pages to use `useTranslations()`
- [ ] Update admin UI for bilingual content editing
- [ ] Add SEO metadata with `alternates`
- [ ] Test language switching
- [ ] Test SEO (canonical + alternate links)

### Documentation
- [ ] Create this plan document
- [ ] Update CONFIGURATION.md
- [ ] Update README.md with i18n setup
- [ ] Document CMS usage for future content updates

---

## 🚀 Deployment Notes

**Environment Variables**: No new env vars needed (uses existing Vercel KV)

**Build Verification**:
```bash
npm run build
# Verify no errors
# Check static vs dynamic routes
```

**Production Deployment**:
```bash
git add .
git commit -m "feat: implement CMS and i18n"
npx vercel --prod
```

**Post-Deployment**:
1. Verify language switcher works
2. Test content CRUD in admin panel
3. Verify SEO metadata
4. Check ISR revalidation

---

**End of Plan - Ready for Claude Code Web Implementation**
