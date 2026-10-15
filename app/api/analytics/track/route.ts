import { NextResponse } from 'next/server'
import { trackPageView } from '@/lib/visitorTracker'
import { analyticsTrackRateLimit, getClientIp } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Drop excess views silently: a scripted client must not inflate the stats
    // or burn KV writes, and a real visitor never needs 30 page views a minute.
    const { success } = await analyticsTrackRateLimit.limit(getClientIp(request))
    if (!success) {
      return NextResponse.json({ success: false }, { status: 200 })
    }

    const body = await request.json()
    const page = typeof body?.page === 'string' ? body.page : ''
    const userAgent = typeof body?.userAgent === 'string' ? body.userAgent : ''
    const screenWidth = typeof body?.screenWidth === 'number' ? body.screenWidth : 0

    if (page && userAgent && screenWidth) {
      await trackPageView(page, userAgent, screenWidth)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visitor track API error:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
