import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getBlogPost,
  saveBlogPost,
  deleteBlogPost,
  generateSlug,
  calculateReadingTime,
} from '@/lib/contentManager'

/**
 * GET - Fetch single blog post by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const post = await getBlogPost(params.id)

  if (!post) {
    return NextResponse.json(
      { error: 'Blog post not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}

/**
 * PUT - Update blog post (Admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const existing = await getBlogPost(params.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.en?.title || !body.en?.description) {
      return NextResponse.json(
        { error: 'Missing required English fields (title, description)' },
        { status: 400 }
      )
    }

    // Update slug if title changed
    const slug = body.slug || (
      body.en.title !== existing.en.title
        ? generateSlug(body.en.title)
        : existing.slug
    )

    // Calculate reading time from updated content
    const content = body.en.content || ''
    const readingTime = calculateReadingTime(content)

    // Update publishedAt if status changes to published
    const publishedAt =
      body.status === 'published' && existing.status === 'draft'
        ? Date.now()
        : existing.publishedAt

    const post = {
      ...existing,
      ...body,
      id: params.id, // Ensure ID doesn't change
      slug,
      updatedAt: Date.now(),
      publishedAt,
      readingTime,
    }

    await saveBlogPost(post)

    return NextResponse.json({ success: true, post })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete blog post (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await deleteBlogPost(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
