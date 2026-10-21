import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllBlogPosts,
  getPublishedBlogPosts,
  saveBlogPost,
  generateSlug,
  generateId,
  calculateReadingTime,
  getBlogSlugOwner,
} from '@/lib/contentManager'
import { findAvailableSlug } from '@/lib/slug'
import type { BlogPost } from '@/lib/contentManager'
import { normalizeLivingThought, getPublishBlockError } from '@/lib/livingThought'
import { syncContentIndex } from '@/lib/contentIndex'

// Creating a published post also indexes it for the chatbot (lib/contentIndex.ts)
export const maxDuration = 60

/**
 * GET - Fetch all blog posts with stats
 */
export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const allPosts = await getAllBlogPosts()

  // Filter out invalid posts (without title - corrupted data)
  const validPosts = allPosts.filter(p => p.en?.title)

  // Sort by updatedAt descending
  const posts = validPosts.sort((a, b) => b.updatedAt - a.updatedAt)

  // Calculate stats based on valid posts only
  const stats = {
    total: validPosts.length,
    draft: validPosts.filter(p => p.status === 'draft').length,
    published: validPosts.filter(p => p.status === 'published').length,
    featured: validPosts.filter(p => p.featured).length,
  }

  return NextResponse.json({
    success: true,
    posts,
    stats,
  })
}

/**
 * POST - Create new blog post (Admin only)
 */
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.en?.title || !body.en?.excerpt) {
      return NextResponse.json(
        { error: 'Missing required English fields (title, excerpt)' },
        { status: 400 }
      )
    }

    const id = generateId()
    const slug = await findAvailableSlug(body.slug || generateSlug(body.en.title), id, getBlogSlugOwner)
    const content = body.en.content || ''
    const readTime = calculateReadingTime(content)
    const now = Date.now()

    const post: BlogPost = {
      id,
      slug,
      status: body.status || 'draft',
      featured: body.featured || false,
      createdAt: now,
      updatedAt: now,
      publishedAt: body.status === 'published' ? now : undefined,
      createdBy: session.user.email || 'admin',
      en: {
        title: body.en.title,
        excerpt: body.en.excerpt || body.en.description || '',
        content,
      },
      vi: body.vi || { title: '', excerpt: '', content: '' },
      category: body.category || 'Uncategorized',
      tags: body.tags || [],
      featuredImage: body.featuredImage || body.image,
      readTime,
      source: body.source,
      ...normalizeLivingThought(body),
    }

    const publishBlockError = getPublishBlockError(post)
    if (publishBlockError) {
      return NextResponse.json({ error: publishBlockError }, { status: 400 })
    }

    await saveBlogPost(post)
    const index = await syncContentIndex('blog', null, post)

    return NextResponse.json({ success: true, post, index }, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
