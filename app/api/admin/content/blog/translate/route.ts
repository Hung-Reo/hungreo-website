import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseTranslateRequest, translateBlogFields } from '@/lib/blogTranslator'

export const maxDuration = 300 // a long post can take a few minutes to translate

/**
 * POST - Translate one language tab of a blog post into the other
 * Admin-only; returns the translation for review, does not save anything
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parseTranslateRequest(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    const translated = await translateBlogFields(parsed.input)
    return NextResponse.json({ success: true, translated })
  } catch (error) {
    console.error('[API] Blog translate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to translate' },
      { status: 500 }
    )
  }
}
