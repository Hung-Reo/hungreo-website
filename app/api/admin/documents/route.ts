import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllDocuments, getDocumentsByStatus, getDocumentStats, type DocumentStatus } from '@/lib/documentManager'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') as DocumentStatus | null
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let documents
    if (status) {
      documents = await getDocumentsByStatus(status)
    } else {
      documents = await getAllDocuments(limit, offset)
    }

    const stats = await getDocumentStats()

    return NextResponse.json({
      success: true,
      documents,
      stats,
      pagination: {
        limit,
        offset,
        total: stats.total,
      },
    })
  } catch (error: any) {
    console.error('Documents list error:', error)
    return NextResponse.json({ error: 'Failed to get documents' }, { status: 500 })
  }
}
