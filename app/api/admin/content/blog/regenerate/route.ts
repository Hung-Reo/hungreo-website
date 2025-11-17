import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { polishBlog } from '@/lib/blogPolisher'

/**
 * POST - Regenerate polished blog content from stored raw draft
 * Admin-only route
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { rawDraft } = body

    // Validate input
    if (!rawDraft || typeof rawDraft !== 'string' || rawDraft.trim().length === 0) {
      return NextResponse.json(
        { error: 'rawDraft is required for regeneration' },
        { status: 400 }
      )
    }

    // Re-polish blog with AI
    console.log('[API] Regenerating blog post from raw draft...')
    const polished = await polishBlog(rawDraft)

    return NextResponse.json({
      success: true,
      polishedData: polished,
    })
  } catch (error) {
    console.error('[API] Blog regenerate error:', error)
    return NextResponse.json(
      {
        error: 'Failed to regenerate blog',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
