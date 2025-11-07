import { auth } from './lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAdmin = req.auth?.user && (req.auth.user as any).role === 'admin'
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin')
  const isLoginPage = req.nextUrl.pathname === '/admin/login'

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

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*'],
}
