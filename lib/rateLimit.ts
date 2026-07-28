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
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
  prefix: 'ratelimit:chatbot',
})

/**
 * Hourly rate limiter for chatbot (backup protection)
 * Prevents sustained abuse over longer periods
 */
export const chatbotHourlyRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
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
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
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
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
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
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
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
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
  prefix: 'ratelimit:upload',
})

/**
 * Rate limiter for public API endpoints (YouTube, etc.)
 * Limits: 3 requests per minute per IP
 * Prevents abuse of expensive operations (OpenAI, YouTube API)
 */
export const publicApiRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(3, '1 m'),
  analytics: false, // writes ratelimit:*:events:* zsets with no TTL that nothing reads
  prefix: 'ratelimit:public:api',
})

/**
 * Helper function to get client IP from request
 * SECURITY: Only trust Vercel-provided headers to prevent IP spoofing
 * Falls back to 'anonymous' if IP cannot be determined
 */
export function getClientIp(request: Request): string {
  // SECURITY FIX: Only use Vercel's trusted x-vercel-forwarded-for header
  // This header is set by Vercel's infrastructure and cannot be spoofed by clients
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for')

  if (vercelForwardedFor) {
    // x-vercel-forwarded-for can contain multiple IPs, get the first one (client IP)
    return vercelForwardedFor.split(',')[0].trim()
  }

  // Secondary option: Cloudflare's CF-Connecting-IP (only if using Cloudflare)
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // DO NOT trust x-forwarded-for or x-real-ip as they can be forged by clients

  // Fallback to anonymous if we can't determine IP
  // This will cause all unidentifiable requests to share the same rate limit
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
