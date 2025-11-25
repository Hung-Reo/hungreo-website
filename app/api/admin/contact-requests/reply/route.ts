import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getContactRequestById, markAsResolved } from '@/lib/contactRequestLogger'
import { sendReplyViaGmail } from '@/lib/gmailSender'

export const runtime = 'nodejs'

/**
 * POST /api/admin/contact-requests/reply
 * Send reply email to user and mark request as resolved
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, replyContent } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    if (!replyContent || !replyContent.trim()) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 })
    }

    // Get the contact request
    const request = await getContactRequestById(id)
    if (!request) {
      return NextResponse.json({ error: 'Contact request not found' }, { status: 404 })
    }

    // Send email to user via Gmail
    const emailSent = await sendReplyViaGmail({
      toEmail: request.email,
      toName: request.name,
      originalQuestion: request.originalQuestion,
      replyContent: replyContent.trim(),
    })

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send email. Please check email configuration.' },
        { status: 500 }
      )
    }

    // Mark as resolved with the reply content
    const updated = await markAsResolved(id, replyContent.trim())

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      request: updated,
    })
  } catch (error: any) {
    console.error('Reply error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send reply' },
      { status: 500 }
    )
  }
}
