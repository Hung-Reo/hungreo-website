import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getContactContent, saveContactContent } from '@/lib/contentManager'

/**
 * GET - Fetch contact methods (admin only)
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const content = await getContactContent()
  return NextResponse.json(content)
}

/**
 * POST - Save contact methods (admin only)
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { methods } = await req.json()

  await saveContactContent({ methods, updatedAt: Date.now() })

  return NextResponse.json({ success: true })
}
