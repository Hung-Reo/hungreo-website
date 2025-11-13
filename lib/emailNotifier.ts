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

const FROM_EMAIL = process.env.EMAIL_FROM || 'chatbot@hungreo.vercel.app'
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
