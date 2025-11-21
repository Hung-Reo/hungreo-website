import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostBySlug } from '@/lib/contentManager'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET - Fetch published blog post by slug (Public route)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const post = await getBlogPostBySlug(params.slug)

  if (!post) {
    return NextResponse.json(
      { error: 'Blog post not found' },
      { status: 404 }
    )
  }

  // Only return published posts
  if (post.status !== 'published') {
    return NextResponse.json(
      { error: 'Blog post not found' },
      { status: 404 }
    )
  }

  // IMPORTANT: Disable caching to ensure fresh content after admin updates
  return NextResponse.json(post, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
