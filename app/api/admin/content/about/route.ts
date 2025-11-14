import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAboutContent, saveAboutContent, AboutContent } from '@/lib/contentManager'

/**
 * GET - Fetch about content (public or admin)
 */
export async function GET() {
  const content = await getAboutContent()

  if (!content) {
    return NextResponse.json(
      { error: 'Content not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(content)
}

/**
 * PUT - Update about content (Admin only)
 */
export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.en?.name || !body.en?.role || !body.en?.intro) {
      return NextResponse.json(
        { error: 'Missing required English fields (name, role, intro)' },
        { status: 400 }
      )
    }

    const content: AboutContent = {
      ...body,
      id: 'about',
      updatedAt: Date.now(),
      updatedBy: session.user.email || 'admin',
    }

    await saveAboutContent(content)

    return NextResponse.json({ success: true, content })
  } catch (error) {
    console.error('Error updating about content:', error)
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    )
  }
}
