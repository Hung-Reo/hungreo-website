import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'
import { passwordResetRateLimit, getClientIp } from '@/lib/rateLimit'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { success } = await passwordResetRateLimit.limit(getClientIp(req))
    if (!success) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { token } = await req.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Hash the token to match what was stored
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Check if token exists in KV
    const email = await kv.get<string>(`password-reset:${tokenHash}`)

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Token is valid
    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error('[Validate Reset Token] Error:', error)
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    )
  }
}
