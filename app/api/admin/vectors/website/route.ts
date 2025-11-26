import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPineconeIndex, listAllVectorIds } from '@/lib/pinecone'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/vectors/website
 * Get all website vectors grouped by page
 * Query param: ?detailed=pageUrl to get full vector content for a specific page
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const detailedPage = searchParams.get('detailed')

    const index = await getPineconeIndex()

    // Get all website vector IDs using proper pagination (no topK limit)
    console.log('[Vectors] Listing all website vectors...')
    const websiteVectorIds = await listAllVectorIds({ vectorType: 'website' })
    console.log(`[Vectors] Found ${websiteVectorIds.length} website vectors`)

    // Fetch metadata for all vectors in batches
    const FETCH_BATCH_SIZE = 1000
    const allVectors: Array<{ id: string; metadata: Record<string, any> }> = []

    for (let i = 0; i < websiteVectorIds.length; i += FETCH_BATCH_SIZE) {
      const batch = websiteVectorIds.slice(i, i + FETCH_BATCH_SIZE)
      const fetchResponse = await index.fetch(batch)

      for (const [id, vector] of Object.entries(fetchResponse.records)) {
        allVectors.push({
          id,
          metadata: vector.metadata || {},
        })
      }
    }

    // If requesting detailed view for a specific page
    if (detailedPage) {
      const pageVectors = allVectors
        .filter((vector) => vector.metadata?.page === detailedPage)
        .map((vector) => ({
          id: vector.id,
          content: vector.metadata?.description || '',
          chunkIndex: (vector.metadata?.chunkIndex as number) || 0,
          title: vector.metadata?.title || '',
        }))
        .sort((a, b) => a.chunkIndex - b.chunkIndex)

      return NextResponse.json({
        success: true,
        page: detailedPage,
        vectors: pageVectors,
      })
    }

    // Group vectors by page (summary view)
    const pageMap = new Map<string, {
      page: string
      vectorCount: number
      lastScraped: number
      vectorIds: string[]
    }>()

    allVectors.forEach((vector) => {
      const page = (vector.metadata?.page as string) || 'unknown'
      const lastScraped = (vector.metadata?.lastScraped as number) || 0

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
      pageData.vectorIds.push(vector.id)
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
      totalVectors: allVectors.length,
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

    // Get all website vector IDs using proper pagination
    console.log('[Vectors] Listing all website vectors for deletion...')
    const websiteVectorIds = await listAllVectorIds({ vectorType: 'website' })
    console.log(`[Vectors] Found ${websiteVectorIds.length} website vectors`)

    // Fetch metadata to filter by page
    const FETCH_BATCH_SIZE = 1000
    const vectorIdsToDelete: string[] = []

    for (let i = 0; i < websiteVectorIds.length; i += FETCH_BATCH_SIZE) {
      const batch = websiteVectorIds.slice(i, i + FETCH_BATCH_SIZE)
      const fetchResponse = await index.fetch(batch)

      for (const [id, vector] of Object.entries(fetchResponse.records)) {
        const page = vector.metadata?.page as string
        if (pages.includes(page)) {
          vectorIdsToDelete.push(id)
        }
      }
    }

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
