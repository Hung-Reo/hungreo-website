import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DEFAULT_HOME_NOW, parseHomeNow } from '@/lib/homeNow'
import { getHomeNow, saveHomeNow } from '@/lib/homeNowStore'

export const runtime = 'nodejs'

/**
 * GET - Homepage "Building now / Learning now" block (Admin only).
 * Returns the defaults (what the homepage shows) when nothing is stored yet.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stored = await getHomeNow()
  return NextResponse.json({ content: stored || DEFAULT_HOME_NOW, isDefault: !stored })
}

/**
 * PUT - Save the block (Admin only). Takes effect on the next homepage load.
 */
export async function PUT(req: NextRequest) {
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

  const parsed = parseHomeNow(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  try {
    await saveHomeNow(parsed.content, session.user.email || 'admin')
    return NextResponse.json({ success: true, content: parsed.content })
  } catch (error) {
    console.error('[API] Failed to save home now block:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
