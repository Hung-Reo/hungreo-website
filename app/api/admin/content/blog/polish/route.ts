import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { polishBlog } from '@/lib/blogPolisher'

/**
 * POST - Polish raw blog draft with AI
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
        { error: 'rawDraft is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (rawDraft.length > 50000) {
      return NextResponse.json(
        { error: 'Draft too long. Maximum 50,000 characters.' },
        { status: 400 }
      )
    }

    // Polish blog with AI
    const polished = await polishBlog(rawDraft)

    return NextResponse.json({
      success: true,
      polishedData: polished,
      source: {
        rawDraft: rawDraft.trim(),
        detectedLanguage: polished.detectedLanguage,
      },
    })
  } catch (error) {
    console.error('[API] Blog polish error:', error)
    return NextResponse.json(
      {
        error: 'Failed to polish blog',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
