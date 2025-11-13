import { GET as NextAuthGET, POST as NextAuthPOST } from '@/lib/auth'
import { NextRequest } from 'next/server'
import {
  adminLoginRateLimit,
  adminLoginStrictRateLimit,
  getClientIp,
} from '@/lib/rateLimit'

// Wrap GET handler (no rate limiting needed for GET)
export const GET = NextAuthGET

// Wrap POST handler with rate limiting for login attempts
export async function POST(req: NextRequest) {
  // Only apply rate limiting to signin endpoint
  const url = new URL(req.url)
  const isSignIn =
    url.pathname.includes('/signin') || url.searchParams.has('signin')

  if (isSignIn) {
    const ip = getClientIp(req)
    console.log(`[Auth] Login attempt from IP: ${ip}`)

    // Check strict rate limit first (10 attempts per hour)
    const { success: strictSuccess, reset: strictReset } =
      await adminLoginStrictRateLimit.limit(ip)

    if (!strictSuccess) {
      const retryAfter = Math.ceil((strictReset - Date.now()) / 1000)
      console.warn(`[Auth] Strict rate limit exceeded for IP: ${ip}`)
      return new Response(
        JSON.stringify({
          error: 'Too Many Failed Login Attempts',
          message:
            'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 giờ. / Too many failed login attempts. Please try again in 1 hour.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    // Check normal rate limit (5 attempts per 15 minutes)
    const { success: normalSuccess, reset: normalReset } =
      await adminLoginRateLimit.limit(ip)

    if (!normalSuccess) {
      const retryAfter = Math.ceil((normalReset - Date.now()) / 1000)
      console.warn(`[Auth] Rate limit exceeded for IP: ${ip}`)
      return new Response(
        JSON.stringify({
          error: 'Too Many Login Attempts',
          message:
            'Quá nhiều lần đăng nhập. Vui lòng thử lại sau 15 phút. / Too many login attempts. Please try again in 15 minutes.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }
  }

  // Proceed with normal NextAuth handling
  return NextAuthPOST(req)
}
