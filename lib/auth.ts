/**
 * NextAuth v5 configuration
 * Handles admin authentication with email + password
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'

// Strip quotes and trim whitespace from environment variables (Vercel adds quotes)
const rawPasswordHash = process.env.ADMIN_PASSWORD_HASH || ''
const ADMIN_PASSWORD_HASH = rawPasswordHash.replace(/^["']|["']$/g, '').trim()

// Debug logging
console.log('[Auth Init] Raw hash from env:', JSON.stringify(rawPasswordHash))
console.log('[Auth Init] Cleaned hash:', JSON.stringify(ADMIN_PASSWORD_HASH))
console.log('[Auth Init] Hash length:', ADMIN_PASSWORD_HASH.length)

// Hardcoded hash for Admin@123 (fallback)
const DEFAULT_PASSWORD_HASH = '$2b$10$AtE9SRSkrQ0ClwQi7OLY3OlWYvcgTR7k2bABJBUyW9PU.pb1Ss612'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  trustHost: true, // IMPORTANT: Required for Vercel deployment
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[Auth] Missing email or password')
          return null
        }

        console.log('[Auth] Login attempt:', {
          email: credentials.email,
          ADMIN_EMAIL,
          hasPassword: !!credentials.password,
          hasHash: !!ADMIN_PASSWORD_HASH,
        })

        // Check if email matches admin email
        if (credentials.email !== ADMIN_EMAIL) {
          console.log('[Auth] Email mismatch')
          return null
        }

        // Verify password - use hardcoded hash as env var is problematic on Vercel
        const passwordHash = DEFAULT_PASSWORD_HASH
        console.log('[Auth] Using hash:', passwordHash.substring(0, 10) + '...')
        console.log('[Auth] Full hash length:', passwordHash.length)
        const isValid = await bcrypt.compare(credentials.password as string, passwordHash)

        console.log('[Auth] Password valid:', isValid)

        if (!isValid) {
          return null
        }

        // Return user object
        return {
          id: '1',
          name: 'Hung Dinh',
          email: ADMIN_EMAIL,
          role: 'admin',
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (extended for better UX)
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true, // Prevents JavaScript access (XSS protection)
        sameSite: 'lax', // CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      },
    },
  },
})

/**
 * Helper function to check if user is authenticated as admin
 */
export async function isAdmin() {
  const session = await auth()
  return session?.user && (session.user as any).role === 'admin'
}

/**
 * Helper function to hash a password
 * Use this to generate ADMIN_PASSWORD_HASH
 * Example: node -e "require('./lib/auth').hashPassword('your-password').then(console.log)"
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
