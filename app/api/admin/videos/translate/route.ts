import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { translateToVietnamese, estimateTranslationCost } from '@/lib/translateVideo'
import { type VideoContent } from '@/lib/videoManager'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/videos/translate
 * Translate video content from English to Vietnamese using AI
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { englishContent } = body

    // Validate English content
    if (!englishContent || !englishContent.title || !englishContent.description) {
      return NextResponse.json(
        { error: 'English title and description are required' },
        { status: 400 }
      )
    }

    // Estimate cost before translating
    const { estimatedCost, estimatedTokens } = estimateTranslationCost(englishContent)

    // Translate to Vietnamese
    const vietnameseContent = await translateToVietnamese(englishContent as VideoContent)

    return NextResponse.json({
      success: true,
      vietnameseContent,
      metadata: {
        estimatedCost,
        estimatedTokens,
        translatedAt: Date.now(),
        translatedBy: session.user.email,
      },
    })
  } catch (error: any) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    )
  }
}
