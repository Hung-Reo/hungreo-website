import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scrapeAndUpdate } from '@/lib/websiteScraper'
import { createJob, updateJobProgress, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const maxDuration = 300 // Allow up to 5 minutes for scraping

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const jobId = `scrape-all-${Date.now()}`

    try {
      // Create job tracker (we'll update total after we know how many pages)
      await createJob(jobId, 'website-scrape', 1)
      await updateJobProgress(jobId, 1, 'Preparing to scrape website (discovering pages)...')

      // Run scraper
      const result = await scrapeAndUpdate()

      await completeJob(jobId, {
        pagesScraped: result.pagesScraped,
        vectorsCreated: result.vectorsCreated,
        errors: result.errors,
      })

      return NextResponse.json({
        success: true,
        jobId,
        result,
      })
    } catch (error: any) {
      await failJob(jobId, error.message)
      throw error
    }
  } catch (error: any) {
    console.error('Scrape error:', error)
    return NextResponse.json({ error: error.message || 'Failed to scrape website' }, { status: 500 })
  }
}
