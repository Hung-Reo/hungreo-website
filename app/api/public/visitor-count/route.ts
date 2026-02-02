import { NextResponse } from 'next/server'
import { getPublicVisitorCount } from '@/lib/visitorTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { count, monthNumber } = await getPublicVisitorCount()

    return NextResponse.json(
      { count, monthNumber },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, max-age=3600, stale-while-revalidate=3600',
        },
      }
    )
  } catch (error) {
    console.error('Public visitor count API error:', error)
    const fallbackMonth = Number(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', month: '2-digit' }).format(
        new Date()
      )
    )
    return NextResponse.json(
      { count: 0, monthNumber: fallbackMonth },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, max-age=3600, stale-while-revalidate=3600',
        },
      }
    )
  }
}
