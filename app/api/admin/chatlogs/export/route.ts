import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getChatLogs } from '@/lib/chatLogger'
import { convertChatLogsToCSV } from '@/lib/chatLogExport'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/chatlogs/export?format=csv|json
 * Export chat logs to CSV or JSON
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)

    // Parse parameters
    const format = searchParams.get('format') || 'csv'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Default to last 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Fetch logs
    const logs = await getChatLogs(startDate, endDate)

    if (format === 'json') {
      // Export as JSON
      return new NextResponse(JSON.stringify(logs, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="chat-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.json"`,
        },
      })
    } else {
      // Export as CSV
      const csv = convertChatLogsToCSV(logs)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chat-logs-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`,
        },
      })
    }
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export logs' },
      { status: 500 }
    )
  }
}
