import { NextRequest, NextResponse } from 'next/server'
import { getChatStats } from '@/lib/chatLogger'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // TODO: Add authentication check once NextAuth is implemented
    // For now, this is a placeholder

    const stats = await getChatStats()

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Failed to get chat statistics' }, { status: 500 })
  }
}
