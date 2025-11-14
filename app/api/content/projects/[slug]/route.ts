import { NextRequest, NextResponse } from 'next/server'
import { getProjectBySlug } from '@/lib/contentManager'

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

  return NextResponse.json(project)
}

export const revalidate = 60 // ISR: Revalidate every 60 seconds
