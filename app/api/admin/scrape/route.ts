import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scrapeAndUpdate } from '@/lib/websiteScraper'
import { createJob, emitProgress, completeJob, failJob } from '@/lib/jobTracker'
import { resolveJobId } from '@/lib/jobId'

export const runtime = 'nodejs'
export const maxDuration = 300 // Allow up to 5 minutes for scraping

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const jobId = resolveJobId(body?.jobId, 'website-scrape')

    try {
      // Create job tracker (we'll update total after we know how many pages)
      await createJob(jobId, 'website-scrape', 1)
      await emitProgress(jobId, 'Preparing to scrape website (discovering pages)...', 0, 1)

      // Run scraper, reporting one step per page plus the embedding phase
      const result = await scrapeAndUpdate(async ({ message, current, total }) => {
        await emitProgress(jobId, message, current ?? 0, total)
      })

      if (result.pagesScraped === 0) {
        await failJob(jobId, result.errors.join('; ') || 'No pages were scraped')
        return NextResponse.json({ success: false, jobId, error: result.errors.join('; ') }, { status: 500 })
      }

      await completeJob(
        jobId,
        {
          pagesScraped: result.pagesScraped,
          vectorsCreated: result.vectorsCreated,
          errors: result.errors,
        },
        `Done: ${result.pagesScraped} pages, ${result.vectorsCreated} vectors` +
          (result.errors.length ? ` (${result.errors.length} warning(s))` : '')
      )

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
