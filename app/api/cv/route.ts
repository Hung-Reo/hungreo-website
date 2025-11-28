import { NextResponse } from 'next/server'
import { getAboutContent } from '@/lib/contentManager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/cv
 * Public endpoint to get CV download URL
 * Returns 404 if no CV uploaded
 */
export async function GET() {
  try {
    const aboutContent = await getAboutContent()

    if (!aboutContent?.cv?.fileUrl) {
      return NextResponse.json(
        { error: 'CV not available' },
        { status: 404 }
      )
    }

    // Return CV metadata (fileUrl is public Vercel Blob URL)
    return NextResponse.json({
      success: true,
      cv: {
        fileName: aboutContent.cv.fileName,
        url: aboutContent.cv.fileUrl,
        uploadedAt: aboutContent.cv.uploadedAt,
      },
    })
  } catch (error) {
    console.error('Get CV error:', error)
    return NextResponse.json(
      { error: 'Failed to get CV' },
      { status: 500 }
    )
  }
}
