/**
 * API Route: Contact Request from Chatbot
 * Handles user email submission when chatbot can't answer
 * or when user directly requests to contact human
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveContactRequest } from '@/lib/contactRequestLogger'
import { notifyContactRequestFromChat } from '@/lib/emailNotifier'
import { chatbotRateLimit, getClientIp, checkRateLimit } from '@/lib/rateLimit'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ContactRequestBody {
  email: string
  name?: string
  originalQuestion: string
  chatSessionId: string
  pageContext?: string
  triggerType: 'fallback' | 'direct_request'
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimitResponse = await checkRateLimit(
      chatbotRateLimit,
      `contact-request:${ip}`,
      'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.'
    )
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Parse request body
    const body: ContactRequestBody = await request.json()

    // Validate required fields
    if (!body.email || !body.originalQuestion || !body.chatSessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          message: 'Email và câu hỏi là bắt buộc.',
        },
        { status: 400 }
      )
    }

    // Validate email format
    if (!EMAIL_REGEX.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
          message: 'Email không hợp lệ. Vui lòng kiểm tra lại.',
        },
        { status: 400 }
      )
    }

    // Validate email length
    if (body.email.length > 254) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email too long',
          message: 'Email quá dài.',
        },
        { status: 400 }
      )
    }

    // Validate name length if provided
    if (body.name && body.name.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name too long',
          message: 'Tên quá dài (tối đa 100 ký tự).',
        },
        { status: 400 }
      )
    }

    // Validate question length
    if (body.originalQuestion.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Question too long',
          message: 'Câu hỏi quá dài.',
        },
        { status: 400 }
      )
    }

    // Validate trigger type
    if (!['fallback', 'direct_request'].includes(body.triggerType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid trigger type',
        },
        { status: 400 }
      )
    }

    // Save contact request to database
    const contactRequest = await saveContactRequest({
      email: body.email.trim().toLowerCase(),
      name: body.name?.trim(),
      originalQuestion: body.originalQuestion,
      chatSessionId: body.chatSessionId,
      pageContext: body.pageContext,
      triggerType: body.triggerType,
    })

    // Send email notification to admin (async, don't wait)
    notifyContactRequestFromChat({
      id: contactRequest.id,
      email: contactRequest.email,
      name: contactRequest.name,
      originalQuestion: contactRequest.originalQuestion,
      pageContext: contactRequest.pageContext,
      triggerType: contactRequest.triggerType,
      createdAt: contactRequest.createdAt,
    }).catch((error) => {
      console.error('Failed to send contact request notification:', error)
    })

    return NextResponse.json({
      success: true,
      message: 'Cảm ơn bạn! Hưng sẽ reply qua email trong vòng 48 giờ.',
      requestId: contactRequest.id,
    })
  } catch (error) {
    console.error('Contact request error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
      },
      { status: 500 }
    )
  }
}
