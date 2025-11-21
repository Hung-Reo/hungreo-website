import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/lib/contentManager'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET - Fetch published project by slug (Public route)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const project = await getProjectBySlug(params.slug)

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  // Only return published projects
  if (project.status !== 'published') {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  // IMPORTANT: Disable caching to ensure fresh content after admin updates
  return NextResponse.json(project, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
