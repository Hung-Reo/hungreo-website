import { auth } from './lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user && (req.auth.user as any).role === 'admin'
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isAdminApiRoute = req.nextUrl.pathname.startsWith('/api/admin')
  const isLoginPage = req.nextUrl.pathname === '/admin/login'

  // SECURITY: Origin validation for admin API routes
  if (isAdminApiRoute) {
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    const host = req.headers.get('host')

    // In production, verify the request comes from the same origin
    if (process.env.NODE_ENV === 'production') {
      const isValidOrigin = origin && origin.includes(host || '')
      const isValidReferer = referer && referer.includes(host || '')

      if (!isValidOrigin && !isValidReferer) {
        console.warn('[Security] Invalid origin for admin API:', {
          path: req.nextUrl.pathname,
          origin,
          referer,
          host,
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

  // Allow access to login page
  if (isLoginPage) {
    // If already logged in, redirect to dashboard
    if (isLoggedIn && isAdmin) {
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
