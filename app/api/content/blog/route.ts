import { NextResponse } from 'next/server'
import { getPublishedBlogPosts } from '@/lib/contentManager'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET - List all published blog posts (Public route)
 */
export async function GET() {
  const posts = await getPublishedBlogPosts()

  // IMPORTANT: Disable caching to ensure fresh content after admin updates
  return NextResponse.json({
    success: true,
    posts,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
