import { NextRequest, NextResponse } from 'next/server'
import { auth } from './lib/auth'

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )
  return response
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')
  const isAdminApiRoute = pathname.startsWith('/api/admin')

  if (isAdminRoute || isAdminApiRoute) {
    // Only call auth() for admin routes — prevents auth cookies on public pages
    const session = await auth()
    const isLoggedIn = !!session
    const isAdmin = session?.user && (session.user as any).role === 'admin'

    const isLoginPage = pathname === '/admin/login'
    const isForgotPasswordPage = pathname === '/admin/forgot-password'
    const isResetPasswordPage = pathname.startsWith('/admin/reset-password/')
    const isForgotPasswordApi = pathname === '/api/admin/forgot-password'
    const isResetPasswordApi = pathname === '/api/admin/reset-password'
    const isValidateTokenApi = pathname === '/api/admin/validate-reset-token'

    if (isAdminApiRoute && !isForgotPasswordApi && !isResetPasswordApi && !isValidateTokenApi) {
      // SECURITY: Origin validation for admin API routes
      const origin = req.headers.get('origin')
      const referer = req.headers.get('referer')
      const host = req.headers.get('host')

      // In production, verify the request comes from the same origin
      if (process.env.NODE_ENV === 'production') {
        let isValidOrigin = false
        let isValidReferer = false

        // Strict origin validation: exact hostname match
        if (origin) {
          try {
            const originUrl = new URL(origin)
            isValidOrigin = originUrl.hostname === host
          } catch {
            console.warn('[Security] Invalid origin URL:', origin)
          }
        }

        // Strict referer validation: exact hostname match
        if (referer) {
          try {
            const refererUrl = new URL(referer)
            isValidReferer = refererUrl.hostname === host
          } catch {
            console.warn('[Security] Invalid referer URL:', referer)
          }
        }

        if (!isValidOrigin && !isValidReferer) {
          return applySecurityHeaders(
            NextResponse.json({ error: 'Forbidden', message: 'Invalid request origin' }, { status: 403 })
          )
        }
      }

      // Additional check: Admin API routes must be authenticated
      // (This is also checked in each API route, but adding defense in depth)
      if (!isLoggedIn || !isAdmin) {
        return applySecurityHeaders(
          NextResponse.json({ error: 'Unauthorized', message: 'Admin access required' }, { status: 401 })
        )
      }
    }

    // Allow access to public auth pages
    if (isLoginPage || isForgotPasswordPage || isResetPasswordPage) {
      // If already logged in, redirect to dashboard (except for password reset pages)
      if (isLoggedIn && isAdmin && !isResetPasswordPage) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/admin/dashboard', req.url)))
      }
      return applySecurityHeaders(NextResponse.next())
    }

    // Protect admin routes
    if (isAdminRoute && !isLoginPage && !isForgotPasswordPage && !isResetPasswordPage) {
      if (!isLoggedIn || !isAdmin) {
        return applySecurityHeaders(NextResponse.redirect(new URL('/admin/login', req.url)))
      }
    }
  }

  return applySecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    // Apply security headers to all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
