import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllBlogPosts,
  getPublishedBlogPosts,
  saveBlogPost,
  generateSlug,
  generateId,
  calculateReadingTime,
} from '@/lib/contentManager'
import type { BlogPost } from '@/lib/contentManager'

/**
 * GET - Fetch all blog posts (with optional status filter)
 * Query params:
 *   - status: 'all' | 'published' | 'draft' (default: 'all')
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'all'

  let posts: BlogPost[] = []

  if (status === 'published') {
    posts = await getPublishedBlogPosts()
  } else {
    posts = await getAllBlogPosts()
    if (status === 'draft') {
      posts = posts.filter((p) => p.status === 'draft')
    }
  }

  return NextResponse.json(posts)
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
    if (!body.en?.title || !body.en?.description) {
      return NextResponse.json(
        { error: 'Missing required English fields (title, description)' },
        { status: 400 }
      )
    }

    const slug = body.slug || generateSlug(body.en.title)
    const content = body.en.content || ''
    const readingTime = calculateReadingTime(content)

    const post: BlogPost = {
      id: generateId(),
      slug,
      status: body.status || 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: body.status === 'published' ? Date.now() : undefined,
      createdBy: session.user.email || 'admin',
      en: {
        title: body.en.title,
        description: body.en.description,
        content,
      },
      vi: body.vi || { title: '', description: '', content: '' },
      tags: body.tags || [],
      image: body.image,
      featured: body.featured || false,
      readingTime,
    }

    await saveBlogPost(post)

    return NextResponse.json({ success: true, post }, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
