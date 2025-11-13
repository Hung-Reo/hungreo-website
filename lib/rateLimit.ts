/**
 * Rate Limiting Configuration
 * Uses Upstash Redis for distributed rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

/**
 * Rate limiter for chatbot API
 * Limits: 10 requests per minute per IP
 * More lenient: 50 requests per hour per IP
 */
export const chatbotRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:chatbot',
})

/**
 * Hourly rate limiter for chatbot (backup protection)
 * Prevents sustained abuse over longer periods
 */
export const chatbotHourlyRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  analytics: true,
  prefix: 'ratelimit:chatbot:hourly',
})

/**
 * Rate limiter for admin login attempts
 * Limits: 5 failed attempts per 15 minutes per IP
 * Prevents brute-force attacks
 */
export const adminLoginRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'ratelimit:admin:login',
})

/**
 * Strict rate limiter for admin login after multiple failures
 * Limits: 10 failed attempts per hour per IP
 * Extended lockout for persistent attackers
 */
export const adminLoginStrictRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:admin:login:strict',
})

/**
 * Rate limiter for admin API routes
 * Limits: 30 requests per minute per IP
 * Prevents API abuse
 */
export const adminApiRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin:api',
})

/**
 * Rate limiter for file uploads
 * Limits: 5 uploads per 10 minutes per IP
 * Prevents storage/processing abuse
 */
export const fileUploadRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'ratelimit:upload',
})

/**
 * Helper function to get client IP from request
 * Falls back to 'anonymous' if IP cannot be determined
 */
export function getClientIp(request: Request): string {
  // Try various headers that might contain the real IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to anonymous if we can't determine IP
  return 'anonymous'
}

/**
 * Helper function to create rate limit error response
 */
export function createRateLimitResponse(
  retryAfter: number,
  message?: string
): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message:
        message ||
        'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau. / You have sent too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

/**
 * Middleware helper to check rate limit
 * Returns null if allowed, Response if blocked
 */
export async function checkRateLimit(
  rateLimit: Ratelimit,
  identifier: string,
  customMessage?: string
): Promise<Response | null> {
  const { success, pending, limit, reset, remaining } =
    await rateLimit.limit(identifier)

  // Wait for pending writes
  await pending

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    return createRateLimitResponse(retryAfter, customMessage)
  }

  return null
}
