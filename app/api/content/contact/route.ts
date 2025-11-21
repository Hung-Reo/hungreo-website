import { NextResponse } from 'next/server'
import { getContactContent } from '@/lib/contentManager'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET - Fetch visible contact methods (public route)
 */
export async function GET() {
  const content = await getContactContent()

  // Filter only visible methods and sort by order
  const visibleMethods = content.methods
    .filter((m) => m.visible)
    .sort((a, b) => a.order - b.order)

  // IMPORTANT: Disable caching to ensure fresh content after admin updates
  return NextResponse.json({ methods: visibleMethods }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  })
}
