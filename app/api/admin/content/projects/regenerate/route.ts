import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseProject, detectLanguage } from '@/lib/projectParser'

/**
 * POST /api/admin/content/projects/regenerate
 * Regenerate project content from stored rawContent
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { rawContent } = await req.json()

    if (!rawContent) {
      return NextResponse.json(
        { error: 'No source content to regenerate from' },
        { status: 400 }
      )
    }

    console.log('[Project Regenerate] Detecting language...')
    const detectedLanguage = await detectLanguage(rawContent)

    console.log('[Project Regenerate] Regenerating with AI...')
    const parsed = await parseProject(rawContent, detectedLanguage)

    console.log('[Project Regenerate] ✅ Regenerated successfully')

    return NextResponse.json({
      success: true,
      parsedData: parsed,
    })
  } catch (error) {
    console.error('[Project Regenerate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate content' },
      { status: 500 }
    )
  }
}
