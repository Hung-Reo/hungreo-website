import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChatStats } from '@/lib/chatLogger'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Authentication check
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getChatStats()

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to get chat statistics' }, { status: 500 })
  }
}
