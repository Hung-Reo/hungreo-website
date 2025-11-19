/**
 * NextAuth v5 configuration
 * Handles admin authentication with email + password
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { kv } from '@vercel/kv'

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'

// SECURITY: Password hash must be stored in environment variable
// The hash is stored in ADMIN_PASSWORD_HASH environment variable
// To generate a new password hash, run:
// node -e "require('bcryptjs').hash('YOUR_NEW_PASSWORD', 10).then(console.log)"
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

// Validate that password hash is configured
if (!ADMIN_PASSWORD_HASH) {
  throw new Error(
    'ADMIN_PASSWORD_HASH environment variable is required. ' +
    'Generate a hash with: node -e "require(\'bcryptjs\').hash(\'YOUR_PASSWORD\', 10).then(console.log)"'
  )
}

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
          console.log('[Auth] Missing credentials')
          return null
        }

        // Check if email matches admin email
        if (credentials.email !== ADMIN_EMAIL) {
          console.log('[Auth] Email mismatch:', credentials.email, 'vs', ADMIN_EMAIL)
          return null
        }

        // Check for password hash in KV first (allows password reset without redeploy)
        let passwordHash = await kv.get<string>('admin:password-hash')

        // Fall back to environment variable if not in KV
        if (!passwordHash) {
          passwordHash = ADMIN_PASSWORD_HASH
        }

        if (!passwordHash) {
          console.error('[Auth] No password hash configured')
          return null
        }

        console.log('[Auth] Using password hash:', passwordHash.substring(0, 20) + '...')
        console.log('[Auth] Password length:', (credentials.password as string).length)

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          passwordHash
        )

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
