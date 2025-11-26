import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scrapeSelectedPages, expandSelectedPages } from '@/lib/websiteScraper'
import { getPineconeIndex } from '@/lib/pinecone'
import { createJob, updateJobProgress, completeJob, failJob } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

/**
 * POST /api/admin/vectors/website/scrape
 * Selectively re-scrape and re-embed specified pages
 * Body: { pages: string[] }  // Array of page paths like ['/contact', '/about']
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pages } = await req.json()

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid pages parameter. Must be non-empty array of page paths.' },
        { status: 400 }
      )
    }

    // Expand pages to include dynamic children (e.g., /blog -> /blog + /blog/[slug])
    const expandedPages = await expandSelectedPages(pages)
    console.log('[Re-scrape] Original pages:', pages)
    console.log('[Re-scrape] Expanded to:', expandedPages)

    const jobId = `rescrape-${Date.now()}`

    try {
      // Delete old vectors for all expanded pages first
      console.log('[Re-scrape] Deleting old vectors for expanded pages:', expandedPages)
      const index = await getPineconeIndex()

      // Query existing vectors for these pages
      const queryResponse = await index.query({
        vector: new Array(1536).fill(0),
        topK: 10000,
        filter: { vectorType: 'website' },
        includeMetadata: true,
        includeValues: false,
      })

      const vectorIdsToDelete = queryResponse.matches
        .filter((match) => expandedPages.includes(match.metadata?.page as string))
        .map((match) => match.id)

      if (vectorIdsToDelete.length > 0) {
        console.log(`[Re-scrape] Deleting ${vectorIdsToDelete.length} old vectors`)
        const BATCH_SIZE = 100
        for (let i = 0; i < vectorIdsToDelete.length; i += BATCH_SIZE) {
          const batch = vectorIdsToDelete.slice(i, i + BATCH_SIZE)
          await index.deleteMany(batch)
        }
      }

      // Create job tracker with expanded page count
      await createJob(jobId, 'selective-rescrape', expandedPages.length)

      // Scrape and embed expanded pages
      console.log('[Re-scrape] Scraping expanded pages:', expandedPages)

      await updateJobProgress(jobId, 1, `Scraping ${expandedPages.length} page(s)...`)

      const result = await scrapeSelectedPages(expandedPages)

      await completeJob(jobId, {
        pagesScraped: result.pagesScraped,
        totalVectors: result.totalVectors,
        deletedVectors: vectorIdsToDelete.length,
        errors: result.errors
      })

      console.log(`[Re-scrape] Successfully re-scraped ${result.pagesScraped} pages with ${result.totalVectors} vectors`)

      return NextResponse.json({
        success: true,
        jobId,
        pagesScraped: result.pagesScraped,
        totalVectors: result.totalVectors,
        deletedVectors: vectorIdsToDelete.length,
        errors: result.errors,
      })
    } catch (error: any) {
      console.error('[Re-scrape] Error:', error)
      await failJob(jobId, error.message)
      throw error
    }
  } catch (error: any) {
    console.error('Selective re-scrape error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to re-scrape pages' },
      { status: 500 }
    )
  }
}
