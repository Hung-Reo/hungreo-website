import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scrapeAndUpdate } from '@/lib/websiteScraper'

export const runtime = 'nodejs'
export const maxDuration = 60 // Allow up to 60 seconds for scraping

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Run scraper
    const result = await scrapeAndUpdate()

    return NextResponse.json({
      success: true,
      result,
    })
  } catch (error: any) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: error.message || 'Failed to scrape website' }, { status: 500 })
  }
}
