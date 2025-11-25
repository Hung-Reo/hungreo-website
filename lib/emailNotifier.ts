/**
 * Email notification system using Resend API
 * Sends notifications when chatbot needs human reply
 */

import { Resend } from 'resend'
import type { ChatLog } from './chatLogger'

// Lazy-load Resend only when needed to prevent crashes when API key is not set
let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

// Note: Free Resend plan only allows sending from onboarding@resend.dev
// and only to the account owner's email. For production, verify your domain.
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const TO_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'

/**
 * Send email notification when chatbot can't answer
 */
export async function notifyHungAboutChat(log: ChatLog): Promise<boolean> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn('Resend API key not configured, skipping email notification')
      return false
    }

    const subject = `🤖 Chatbot needs help: "${log.userMessage.substring(0, 50)}${log.userMessage.length > 50 ? '...' : ''}"`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 24px;
              border: 1px solid #e5e7eb;
            }
            .header {
              background-color: #3b82f6;
              color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .section {
              background-color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 16px;
              border: 1px solid #e5e7eb;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .value {
              color: #111827;
              font-size: 16px;
            }
            .context {
              background-color: #fef3c7;
              padding: 12px;
              border-radius: 4px;
              border-left: 4px solid #f59e0b;
              margin-top: 12px;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 24px;
            }
            .button {
              display: inline-block;
              background-color: #3b82f6;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Chatbot Alert: Needs Human Reply</h2>
            </div>

            <div class="section">
              <div class="label">User Question:</div>
              <div class="value">${escapeHtml(log.userMessage)}</div>
            </div>

            <div class="section">
              <div class="label">AI Response:</div>
              <div class="value">${escapeHtml(log.assistantResponse)}</div>
            </div>

            ${
              log.pageContext
                ? `
            <div class="section">
              <div class="label">Page Context:</div>
              <div class="value">
                ${log.pageContext.page}
                ${log.pageContext.videoId ? `<br/>Video ID: ${log.pageContext.videoId}` : ''}
                ${log.pageContext.category ? `<br/>Category: ${log.pageContext.category}` : ''}
              </div>
            </div>
            `
                : ''
            }

            <div class="section">
              <div class="label">Metadata:</div>
              <div class="value">
                <strong>Time:</strong> ${new Date(log.timestamp).toLocaleString('vi-VN')}<br/>
                <strong>Session ID:</strong> ${log.sessionId}<br/>
                <strong>Response Time:</strong> ${log.responseTime}ms<br/>
                <strong>Relevant Docs:</strong> ${log.relevantDocs || 0}
              </div>
            </div>

            <div class="context">
              <strong>⚠️ Why this notification?</strong><br/>
              The AI couldn't confidently answer this question. The user may benefit from a personal response from you.
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/chatlogs" class="button">
                View in Admin Dashboard
              </a>
            </div>

            <div class="footer">
              <p>This is an automated notification from your website chatbot.</p>
              <p>Chat ID: ${log.id}</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error('Failed to send email notification:', error)
    return false
  }
}

/**
 * Send email when user requests contact
 */
export async function notifyContactRequest(data: {
  name: string
  email: string
  message: string
}): Promise<boolean> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn('Resend API key not configured, skipping email notification')
      return false
    }

    const subject = `📧 New Contact Request from ${data.name}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 24px;
              border: 1px solid #e5e7eb;
            }
            .header {
              background-color: #10b981;
              color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .section {
              background-color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 16px;
              border: 1px solid #e5e7eb;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .value {
              color: #111827;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Contact Request</h2>
            </div>

            <div class="section">
              <div class="label">From:</div>
              <div class="value">${escapeHtml(data.name)}</div>
            </div>

            <div class="section">
              <div class="label">Email:</div>
              <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>

            <div class="section">
              <div class="label">Message:</div>
              <div class="value">${escapeHtml(data.message)}</div>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html,
      replyTo: data.email,
    })

    return true
  } catch (error) {
    console.error('Failed to send contact request email:', error)
    return false
  }
}

/**
 * Send email notification when user submits contact request from chatbot
 * Triggered when:
 * 1. Chatbot can't answer (fallback) and user leaves email
 * 2. User directly asks to contact human
 */
export async function notifyContactRequestFromChat(data: {
  id: string
  email: string
  name?: string
  originalQuestion: string
  pageContext?: string
  triggerType: 'fallback' | 'direct_request'
  createdAt: number
}): Promise<boolean> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn('Resend API key not configured, skipping email notification')
      return false
    }

    const triggerLabel = data.triggerType === 'fallback'
      ? 'Chatbot không trả lời được'
      : 'User yêu cầu liên hệ trực tiếp'

    const subject = `📬 Contact Request: ${data.name || data.email} - ${triggerLabel}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 24px;
              border: 1px solid #e5e7eb;
            }
            .header {
              background-color: #8b5cf6;
              color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 20px;
            }
            .section {
              background-color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 16px;
              border: 1px solid #e5e7eb;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 4px;
            }
            .value {
              color: #111827;
              font-size: 16px;
            }
            .trigger-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .trigger-fallback {
              background-color: #fef3c7;
              color: #92400e;
            }
            .trigger-direct {
              background-color: #dbeafe;
              color: #1e40af;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 24px;
            }
            .button {
              display: inline-block;
              background-color: #8b5cf6;
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              margin: 8px 4px;
            }
            .button-secondary {
              background-color: #6b7280;
            }
            .reminder {
              background-color: #fef3c7;
              padding: 12px;
              border-radius: 4px;
              border-left: 4px solid #f59e0b;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Contact Request from Chatbot</h2>
            </div>

            <span class="trigger-badge ${data.triggerType === 'fallback' ? 'trigger-fallback' : 'trigger-direct'}">
              ${triggerLabel}
            </span>

            <div class="section">
              <div class="label">Email:</div>
              <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
            </div>

            ${data.name ? `
            <div class="section">
              <div class="label">Tên:</div>
              <div class="value">${escapeHtml(data.name)}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="label">Câu hỏi gốc:</div>
              <div class="value">${escapeHtml(data.originalQuestion)}</div>
            </div>

            ${data.pageContext ? `
            <div class="section">
              <div class="label">Trang:</div>
              <div class="value">${escapeHtml(data.pageContext)}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="label">Thời gian:</div>
              <div class="value">${new Date(data.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</div>
            </div>

            <div class="reminder">
              <strong>⏰ Nhắc nhở:</strong> User đang chờ reply trong vòng 48 giờ!
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <a href="mailto:${data.email}?subject=Re: Câu hỏi của bạn trên Hungreo&body=Chào ${data.name || 'bạn'},%0D%0A%0D%0ACảm ơn bạn đã liên hệ. Về câu hỏi: '${encodeURIComponent(data.originalQuestion)}'%0D%0A%0D%0A" class="button">
                📧 Reply ngay
              </a>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/contact-requests" class="button button-secondary">
                📋 Xem Dashboard
              </a>
            </div>

            <div class="footer">
              <p>Request ID: ${data.id}</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject,
      html,
      replyTo: data.email,
    })

    return true
  } catch (error) {
    console.error('Failed to send contact request notification:', error)
    return false
  }
}

/**
 * Send reply email to user from admin
 */
export async function sendReplyToUser(data: {
  toEmail: string
  toName?: string
  originalQuestion: string
  replyContent: string
}): Promise<boolean> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn('Resend API key not configured, skipping email')
      return false
    }

    const subject = `Re: Câu hỏi của bạn trên Hungreo`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 24px;
              border: 1px solid #e5e7eb;
            }
            .header {
              background-color: #10b981;
              color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 20px;
              text-align: center;
            }
            .section {
              background-color: white;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 16px;
              border: 1px solid #e5e7eb;
            }
            .label {
              font-weight: 600;
              color: #6b7280;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .original-question {
              background-color: #f3f4f6;
              padding: 12px;
              border-radius: 4px;
              border-left: 4px solid #9ca3af;
              font-style: italic;
              color: #6b7280;
            }
            .reply-content {
              color: #111827;
              font-size: 16px;
              white-space: pre-wrap;
            }
            .footer {
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            }
            .signature {
              margin-top: 24px;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Hưng from Hungreo</h2>
            </div>

            <p>Chào ${data.toName || 'bạn'},</p>

            <p>Cảm ơn bạn đã liên hệ qua chatbot. Về câu hỏi của bạn:</p>

            <div class="original-question">
              "${escapeHtml(data.originalQuestion)}"
            </div>

            <div class="section" style="margin-top: 16px;">
              <div class="reply-content">${escapeHtml(data.replyContent)}</div>
            </div>

            <div class="signature">
              <p>Nếu bạn có thêm câu hỏi, cứ reply email này nhé!</p>
              <p>
                Best regards,<br/>
                <strong>Hưng</strong><br/>
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://hungreo.com'}">hungreo.com</a>
              </p>
            </div>

            <div class="footer">
              <p>Email này được gửi từ Hungreo Chatbot System</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: `Hưng from Hungreo <${FROM_EMAIL}>`,
      to: data.toEmail,
      subject,
      html,
      replyTo: TO_EMAIL, // Replies go to admin email
    })

    return true
  } catch (error) {
    console.error('Failed to send reply to user:', error)
    return false
  }
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}
