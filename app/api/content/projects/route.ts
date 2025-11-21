import { NextResponse } from 'next/server'
import { getPublishedProjects } from '@/lib/contentManager'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET - List all published projects (Public route)
 */
export async function GET() {
  const projects = await getPublishedProjects()

  // IMPORTANT: Disable caching to ensure fresh content after admin updates
  return NextResponse.json({
    success: true,
    projects,
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
