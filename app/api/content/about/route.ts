import { NextResponse } from 'next/server'
import { getAboutContent } from '@/lib/contentManager'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Public API endpoint for About page content
 * No authentication required - this is public data
 */
export async function GET() {
  try {
    const content = await getAboutContent()

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      )
    }

    // Strip internal/admin-only fields before returning to public clients
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedBy, embeddings, id, version, ...publicContent } = content

    // IMPORTANT: Disable caching to ensure fresh content after admin updates
    return NextResponse.json(publicContent, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('[Public API] Error fetching about content:', error)
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    )
  }
}
