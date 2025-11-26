import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getJobStatus } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/jobs/[id]
 * Poll job status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const job = await getJobStatus(id)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, job })
  } catch (error: any) {
    console.error('Get job status error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    )
  }
}
