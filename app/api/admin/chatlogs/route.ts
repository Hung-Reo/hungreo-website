import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChatLogs, markAsReplied, type ChatLog } from '@/lib/chatLogger'

export const runtime = 'nodejs'

/**
 * GET /api/admin/chatlogs
 * Fetch chat logs with filters and pagination
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
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const needsReplyParam = searchParams.get('needsReply')
    const searchQuery = searchParams.get('search')
    const limitParam = searchParams.get('limit') || '20'
    const offsetParam = searchParams.get('offset') || '0'

    // Default to last 7 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Fetch logs
    let logs = await getChatLogs(startDate, endDate)

    // Filter by needs reply
    if (needsReplyParam === 'true') {
      logs = logs.filter(log => log.needsHumanReply === true)
    } else if (needsReplyParam === 'false') {
      logs = logs.filter(log => !log.needsHumanReply)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      logs = logs.filter(log =>
        log.userMessage.toLowerCase().includes(query) ||
        log.assistantResponse.toLowerCase().includes(query)
      )
    }

    // Pagination
    const limit = parseInt(limitParam)
    const offset = parseInt(offsetParam)
    const total = logs.length
    const paginatedLogs = logs.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      logs: paginatedLogs,
      total,
      pagination: {
        limit,
        offset,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Chat logs API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get chat logs' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/chatlogs
 * Mark a chat as replied
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatId, action } = await req.json()

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 })
    }

    if (action === 'markReplied') {
      await markAsReplied(chatId)
      return NextResponse.json({
        success: true,
        message: 'Chat marked as replied',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Chat logs action error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to perform action' },
      { status: 500 }
    )
  }
}
