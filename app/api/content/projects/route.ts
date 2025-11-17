import { NextResponse } from 'next/server'
import { getPublishedProjects } from '@/lib/contentManager'

/**
 * GET - List all published projects (Public route)
 */
export async function GET() {
  const projects = await getPublishedProjects()

  return NextResponse.json({
    success: true,
    projects,
  })
}

export const revalidate = 60 // ISR: Revalidate every 60 seconds
