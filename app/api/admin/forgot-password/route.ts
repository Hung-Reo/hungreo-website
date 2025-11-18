import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // SECURITY: Check if email matches admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      // Don't reveal if email exists or not (prevent enumeration)
      // Always return success but don't send email
      return NextResponse.json({
        message: 'If this email is registered, a password reset link has been sent.',
      })
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Store token in KV with 15 minute expiry
    await kv.setex(`password-reset:${resetTokenHash}`, 900, email) // 900 seconds = 15 minutes

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password/${resetToken}`

    await resend.emails.send({
      from: 'Hungreo Website <noreply@hungreo.com>',
      to: email,
      subject: 'Reset Your Admin Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Password Reset Request</h2>
          <p>You requested to reset your admin password for Hungreo Website.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Reset Password
          </a>
          <p style="color: #64748B; font-size: 14px;">
            This link will expire in 15 minutes.<br/>
            If you didn't request this, please ignore this email.
          </p>
          <p style="color: #64748B; font-size: 14px;">
            Or copy and paste this URL into your browser:<br/>
            <code style="background: #F1F5F9; padding: 4px 8px; border-radius: 4px;">${resetUrl}</code>
          </p>
        </div>
      `,
    })

    return NextResponse.json({
      message: 'If this email is registered, a password reset link has been sent.',
    })
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
