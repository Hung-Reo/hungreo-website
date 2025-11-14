import { NextRequest, NextResponse } from 'next/server'
import { getBlogPostBySlug } from '@/lib/contentManager'

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

  return NextResponse.json(post)
}

export const revalidate = 60 // ISR: Revalidate every 60 seconds
