import { auth } from './lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user && (req.auth.user as any).role === 'admin'
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin')
  const isLoginPage = req.nextUrl.pathname === '/admin/login'
  const isForgotPasswordPage = req.nextUrl.pathname === '/admin/forgot-password'
  const isResetPasswordPage = req.nextUrl.pathname.startsWith('/admin/reset-password/')

  // Public API routes that don't require authentication
  const isForgotPasswordApi = req.nextUrl.pathname === '/api/admin/forgot-password'
  const isResetPasswordApi = req.nextUrl.pathname === '/api/admin/reset-password'
  const isValidateTokenApi = req.nextUrl.pathname === '/api/admin/validate-reset-token'

  // SECURITY: Origin validation for admin API routes
  if (isAdminApiRoute && !isForgotPasswordApi && !isResetPasswordApi && !isValidateTokenApi) {
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
        } catch (error) {
          console.warn('[Security] Invalid origin URL:', origin)
        }
      }

      // Strict referer validation: exact hostname match
      if (referer) {
        try {
          const refererUrl = new URL(referer)
          isValidReferer = refererUrl.hostname === host
        } catch (error) {
          console.warn('[Security] Invalid referer URL:', referer)
        }
      }

      if (!isValidOrigin && !isValidReferer) {
        console.warn('[Security] Invalid origin for admin API:', {
          path: req.nextUrl.pathname,
          origin,
          referer,
          host,
          attemptedOriginHostname: origin ? new URL(origin).hostname : 'N/A',
        })

        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Invalid request origin',
          },
          { status: 403 }
        )
      }
    }

    // Additional check: Admin API routes must be authenticated
    // (This is also checked in each API route, but adding defense in depth)
    if (!isLoggedIn || !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Admin access required' },
        { status: 401 }
      )
    }
  }

  // Allow access to public auth pages
  if (isLoginPage || isForgotPasswordPage || isResetPasswordPage) {
    // If already logged in, redirect to dashboard (except for password reset pages)
    if (isLoggedIn && isAdmin && !isResetPasswordPage) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protect admin routes
  if (isAdminRoute) {
    if (!isLoggedIn || !isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next()

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy (disable unnecessary features)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
})

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    // Apply security headers to all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
