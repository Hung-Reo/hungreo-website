import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    // Validate inputs
    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Hash the token to match stored version
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Verify token exists in KV
    const email = await kv.get<string>(`password-reset:${tokenHash}`)

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Generate new password hash
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Store new password hash in KV (as backup/override)
    // You'll still need to update ADMIN_PASSWORD_HASH env variable in Vercel
    await kv.set('admin:password-hash', newPasswordHash)

    // Delete used reset token
    await kv.del(`password-reset:${tokenHash}`)

    return NextResponse.json({
      message: 'Password reset successful. Please update ADMIN_PASSWORD_HASH in Vercel environment variables.',
      newPasswordHash, // Return this so user can copy to Vercel
    })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
