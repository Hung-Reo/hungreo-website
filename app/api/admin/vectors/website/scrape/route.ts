import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { scrapeSelectedPages, expandSelectedPages } from '@/lib/websiteScraper'
import { getPineconeIndex, listAllVectorIds } from '@/lib/pinecone'
import { createJob, emitProgress, appendLog, completeJob, failJob } from '@/lib/jobTracker'

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
      const index = await getPineconeIndex()

      // Create job tracker with expanded page count
      await createJob(jobId, 'selective-rescrape', expandedPages.length || 1)
      await appendLog(jobId, 'info', `Starting re-scrape for ${expandedPages.length} page(s)`)
      await emitProgress(jobId, 'Preparing to re-scrape pages...', 0, expandedPages.length || 1)

      // Snapshot existing vectors for the expanded pages BEFORE scraping, but do
      // NOT delete yet. Vector IDs are deterministic, so the re-scrape upserts
      // overwrite the current chunks in place; we only delete leftover stale
      // vectors afterwards, and only for pages that actually scraped. This way a
      // failed scrape never wipes a page's existing vectors.
      console.log('[Re-scrape] Snapshotting existing vectors for expanded pages:', expandedPages)
      const websiteVectorIds = await listAllVectorIds({ vectorType: 'website' })
      console.log(`[Re-scrape] Found ${websiteVectorIds.length} total website vectors`)
      await appendLog(jobId, 'info', `Found ${websiteVectorIds.length} website vectors total`)

      // Fetch metadata to map existing vector IDs to their page
      const FETCH_BATCH_SIZE = 1000
      const existingByPage: Array<{ id: string; page: string }> = []

      for (let i = 0; i < websiteVectorIds.length; i += FETCH_BATCH_SIZE) {
        const batch = websiteVectorIds.slice(i, i + FETCH_BATCH_SIZE)
        const fetchResponse = await index.fetch(batch)

        for (const [id, vector] of Object.entries(fetchResponse.records)) {
          const page = vector.metadata?.page as string
          if (expandedPages.includes(page)) {
            existingByPage.push({ id, page })
          }
        }
      }

      // Scrape and embed expanded pages (upserts new vectors with deterministic IDs)
      console.log('[Re-scrape] Scraping expanded pages:', expandedPages)
      await appendLog(jobId, 'info', `Scraping ${expandedPages.length} page(s)...`)

      const result = await scrapeSelectedPages(expandedPages, async (info) => {
        if (info.message) {
          await appendLog(jobId, 'info', info.message)
        }
        const current = info.current ?? 0
        // Parens to avoid ?? with || precedence issues
        const total = (info.total ?? expandedPages.length) || 1
        await emitProgress(jobId, info.message, current, total)
      })

      // Now delete only stale leftover vectors: belong to a page that scraped
      // successfully but were not overwritten by the new upserts. Pages that
      // failed to scrape keep their existing vectors untouched.
      const scrapedSet = new Set(result.scrapedPages)
      const upsertedSet = new Set(result.upsertedIds)
      const vectorIdsToDelete = existingByPage
        .filter(v => scrapedSet.has(v.page) && !upsertedSet.has(v.id))
        .map(v => v.id)

      if (vectorIdsToDelete.length > 0) {
        console.log(`[Re-scrape] Deleting ${vectorIdsToDelete.length} stale vectors`)
        await appendLog(jobId, 'info', `Deleting ${vectorIdsToDelete.length} stale vectors`)
        const BATCH_SIZE = 100
        for (let i = 0; i < vectorIdsToDelete.length; i += BATCH_SIZE) {
          await index.deleteMany(vectorIdsToDelete.slice(i, i + BATCH_SIZE))
        }
      }

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
