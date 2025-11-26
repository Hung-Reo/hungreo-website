import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex } from '@/lib/pinecone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/vectors/website
 * Get all website vectors grouped by page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const index = await getPineconeIndex()

    // Query all website vectors
    // Note: Pinecone doesn't support "count by metadata" natively
    // So we query all vectors and group manually
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0), // Dummy vector for metadata-only query
      topK: 10000, // Max limit
      filter: { vectorType: 'website' },
      includeMetadata: true,
      includeValues: false,
    })

    // Group vectors by page
    const pageMap = new Map<string, {
      page: string
      vectorCount: number
      lastScraped: number
      vectorIds: string[]
    }>()

    queryResponse.matches.forEach((match) => {
      const page = (match.metadata?.page as string) || 'unknown'
      const lastScraped = (match.metadata?.lastScraped as number) || 0

      if (!pageMap.has(page)) {
        pageMap.set(page, {
          page,
          vectorCount: 0,
          lastScraped,
          vectorIds: [],
        })
      }

      const pageData = pageMap.get(page)!
      pageData.vectorCount++
      pageData.vectorIds.push(match.id)
      // Update lastScraped to most recent
      if (lastScraped > pageData.lastScraped) {
        pageData.lastScraped = lastScraped
      }
    })

    // Convert to array and sort by page path
    const pages = Array.from(pageMap.values()).sort((a, b) => {
      // Sort by path (/, /about, /blog, /contact, /projects)
      const order = ['/', '/about', '/projects', '/blog', '/contact']
      const aIndex = order.indexOf(a.page)
      const bIndex = order.indexOf(b.page)
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.page.localeCompare(b.page)
    })

    return NextResponse.json({
      success: true,
      pages,
      totalVectors: queryResponse.matches.length,
    })
  } catch (error: any) {
    console.error('Failed to get website vectors:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get website vectors' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/vectors/website
 * Delete vectors for selected pages
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pages } = await req.json()

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid pages parameter' },
        { status: 400 }
      )
    }

    const index = await getPineconeIndex()

    // Get all website vectors
    const queryResponse = await index.query({
      vector: new Array(1536).fill(0),
      topK: 10000,
      filter: { vectorType: 'website' },
      includeMetadata: true,
      includeValues: false,
    })

    // Filter vectors belonging to selected pages
    const vectorIdsToDelete = queryResponse.matches
      .filter((match) => pages.includes(match.metadata?.page as string))
      .map((match) => match.id)

    if (vectorIdsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No vectors found for selected pages',
      })
    }

    // Delete in batches of 100 (Pinecone limit)
    const BATCH_SIZE = 100
    for (let i = 0; i < vectorIdsToDelete.length; i += BATCH_SIZE) {
      const batch = vectorIdsToDelete.slice(i, i + BATCH_SIZE)
      await index.deleteMany(batch)
    }

    console.log(`[Vectors] Deleted ${vectorIdsToDelete.length} vectors from pages:`, pages)

    return NextResponse.json({
      success: true,
      deleted: vectorIdsToDelete.length,
      pages,
    })
  } catch (error: any) {
    console.error('Failed to delete website vectors:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete website vectors' },
      { status: 500 }
    )
  }
}
