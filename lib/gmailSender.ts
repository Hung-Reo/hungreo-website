/**
 * Gmail sender using Nodemailer
 * For sending reply emails to users from admin
 *
 * Setup:
 * 1. Enable 2FA on your Gmail account
 * 2. Create App Password: Google Account → Security → App passwords
 * 3. Add to .env.local:
 *    GMAIL_USER=your@gmail.com
 *    GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
 */

import nodemailer from 'nodemailer'

// Lazy-load transporter
let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not configured')
    return null
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }

  return transporter
}

/**
 * Send reply email to user via Gmail
 */
export async function sendReplyViaGmail(data: {
  toEmail: string
  toName?: string
  originalQuestion: string
  replyContent: string
}): Promise<boolean> {
  try {
    const transport = getTransporter()
    if (!transport) {
      console.error('Gmail transporter not available')
      return false
    }

    const senderName = 'Hưng from Hungreo'
    const senderEmail = process.env.GMAIL_USER

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

            <p>Chào ${escapeHtml(data.toName || 'bạn')},</p>

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

    await transport.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: data.toEmail,
      subject: `Re: Câu hỏi của bạn trên Hungreo`,
      html,
    })

    console.log(`Email sent successfully to ${data.toEmail}`)
    return true
  } catch (error) {
    console.error('Failed to send email via Gmail:', error)
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

/**
 * Test Gmail connection
 */
export async function testGmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter()
    if (!transport) return false

    await transport.verify()
    console.log('Gmail connection verified successfully')
    return true
  } catch (error) {
    console.error('Gmail connection failed:', error)
    return false
  }
}
