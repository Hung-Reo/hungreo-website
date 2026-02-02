import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { resetVisitorStats } from '@/lib/visitorTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const scope = body?.scope === 'today' || body?.scope === 'week' || body?.scope === 'month'
      ? body.scope
      : 'month'

    await resetVisitorStats(scope)

    return NextResponse.json({ success: true, scope })
  } catch (error) {
    console.error('Reset visitor stats API error:', error)
    return NextResponse.json({ error: 'Failed to reset visitor stats' }, { status: 500 })
  }
}
