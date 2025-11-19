import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'
const BACKUP_ADMIN_EMAIL = process.env.BACKUP_ADMIN_EMAIL

// Helper to check if email is an admin email
function isAdminEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase()
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return true
  if (BACKUP_ADMIN_EMAIL && normalizedEmail === BACKUP_ADMIN_EMAIL.toLowerCase()) return true
  return false
}

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumber = /[0-9]/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      return NextResponse.json(
        { error: 'Password must contain uppercase, lowercase, number, and special character' },
        { status: 400 }
      )
    }

    // Hash the token to match what was stored
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Get and verify the token
    const email = await kv.get<string>(`password-reset:${tokenHash}`)

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Verify email matches any admin email
    if (!isAdminEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid reset request' },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Store the new password hash in KV
    // This will be used by lib/auth.ts which checks KV first before falling back to env var
    await kv.set('admin:password-hash', passwordHash)

    // Delete the used reset token
    await kv.del(`password-reset:${tokenHash}`)

    console.log('[Reset Password] Password updated successfully for:', email)

    return NextResponse.json({
      message: 'Password reset successfully',
    })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
