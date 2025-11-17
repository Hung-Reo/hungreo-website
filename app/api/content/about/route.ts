import { NextResponse } from 'next/server'
import { getAboutContent } from '@/lib/contentManager'

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

    return NextResponse.json(content)
  } catch (error) {
    console.error('[Public API] Error fetching about content:', error)
    return NextResponse.json(
      { error: 'Failed to load content' },
      { status: 500 }
    )
  }
}
