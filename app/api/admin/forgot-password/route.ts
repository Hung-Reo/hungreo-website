import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { Resend } from 'resend'
import crypto from 'crypto'
import { Ratelimit } from '@upstash/ratelimit'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'
const BACKUP_ADMIN_EMAIL = process.env.BACKUP_ADMIN_EMAIL

// Rate limiter for forgot-password endpoint
// SECURITY: Prevent email flooding and token generation spam
const forgotPasswordRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, '15 m'), // 3 requests per 15 minutes per IP
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
  prefix: 'ratelimit:forgot-password:ip',
})

const forgotPasswordEmailRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(2, '1 h'), // 2 requests per hour per email
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
  prefix: 'ratelimit:forgot-password:email',
})

// Helper to get client IP (using trusted headers only)
function getClientIp(request: Request): string {
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim()
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  return 'anonymous'
}

// Helper to check if email is an admin email
function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase()
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return true
  if (BACKUP_ADMIN_EMAIL && normalizedEmail === BACKUP_ADMIN_EMAIL.toLowerCase()) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Apply IP-based rate limiting first (prevents spam from single IP)
    const clientIp = getClientIp(req)
    const ipRateLimitResult = await forgotPasswordRateLimit.limit(clientIp)

    if (!ipRateLimitResult.success) {
      console.warn(`[Forgot Password] Rate limit exceeded for IP: ${clientIp}`)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { email } = await req.json()

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // SECURITY: Apply email-based rate limiting (prevents spam to specific email)
    const emailRateLimitResult = await forgotPasswordEmailRateLimit.limit(email.toLowerCase())

    if (!emailRateLimitResult.success) {
      console.warn(`[Forgot Password] Rate limit exceeded for email: ${email}`)
      // Return generic message to prevent enumeration
      return NextResponse.json({
        message: 'If this email is registered, a password reset link has been sent.',
      })
    }

    // SECURITY: Check if email matches any admin email
    if (!isAdminEmail(email)) {
      // Don't reveal if email exists or not (prevent enumeration)
      // Always return success but don't send email
      return NextResponse.json({
        message: 'If this email is registered, a password reset link has been sent.',
      })
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact administrator.' },
        { status: 503 }
      )
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')

    // Store token in KV with 15 minute expiry
    await kv.set(`password-reset:${resetTokenHash}`, email, { ex: 900 }) // 900 seconds = 15 minutes

    // Send reset email
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/reset-password/${resetToken}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Hungreo Website <onboarding@resend.dev>',
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
