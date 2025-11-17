import { NextResponse } from 'next/server'
import { getPublishedBlogPosts } from '@/lib/contentManager'

/**
 * GET - List all published blog posts (Public route)
 */
export async function GET() {
  const posts = await getPublishedBlogPosts()

  return NextResponse.json({
    success: true,
    posts,
  })
}

export const revalidate = 60 // ISR: Revalidate every 60 seconds
