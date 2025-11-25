import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getContactRequests,
  getContactRequestStats,
  updateContactRequest,
  type ContactRequest,
} from '@/lib/contactRequestLogger'

export const runtime = 'nodejs'

/**
 * GET /api/admin/contact-requests
 * Fetch contact requests with filters and pagination
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    // Parse query parameters
    const status = searchParams.get('status') as 'pending' | 'resolved' | 'all' | null
    const limitParam = searchParams.get('limit') || '20'
    const offsetParam = searchParams.get('offset') || '0'

    const limit = parseInt(limitParam)
    const offset = parseInt(offsetParam)

    // Fetch requests
    const { requests, total } = await getContactRequests({
      status: status || 'all',
      limit,
      offset,
    })

    // Get stats
    const stats = await getContactRequestStats()

    return NextResponse.json({
      success: true,
      requests,
      total,
      stats,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Contact requests API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get contact requests' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/contact-requests
 * Update contact request status
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    if (status && !['pending', 'resolved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const updated = await updateContactRequest(id, { status })

    if (!updated) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      request: updated,
    })
  } catch (error: any) {
    console.error('Contact request update error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update contact request' },
      { status: 500 }
    )
  }
}
