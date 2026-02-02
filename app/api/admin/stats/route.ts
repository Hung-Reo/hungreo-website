import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChatStats } from '@/lib/chatLogger'
import { getContactRequestStats } from '@/lib/contactRequestLogger'
import { getVisitorStats } from '@/lib/visitorTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 🚀 Server-side cache for stats (30-second TTL)
let cachedStats: any = null
let cacheTime = 0
const CACHE_DURATION = 30 * 1000 // 30 seconds

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Authentication check
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = Date.now()

    // Return cached data if still fresh
    if (cachedStats && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        stats: cachedStats,
        cached: true,
      })
    }

    // Fetch fresh data
    const [chatStats, contactStats, visitorStats] = await Promise.all([
      getChatStats(),
      getContactRequestStats(),
      getVisitorStats(),
    ])

    const stats = {
      ...chatStats,
      contactRequests: contactStats,
      visitors: visitorStats,
    }

    // Update cache
    cachedStats = stats
    cacheTime = now

    return NextResponse.json({
      success: true,
      stats,
      cached: false,
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to get chat statistics' }, { status: 500 })
  }
}
