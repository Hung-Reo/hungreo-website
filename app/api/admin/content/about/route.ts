import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAboutContent, saveAboutContent, AboutContent } from '@/lib/contentManager'

// Force Node.js runtime for PUT/POST/DELETE support
export const runtime = 'nodejs'

/**
 * OPTIONS - Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

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

    // Validate required fields (new structure)
    if (!body.hero?.en?.name || !body.hero?.en?.role || !body.hero?.en?.intro) {
      return NextResponse.json(
        { error: 'Missing required English fields (name, role, intro)' },
        { status: 400 }
      )
    }

    const content: AboutContent = {
      ...body,
      id: 'about',
      version: body.version || '1.0.0',
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
