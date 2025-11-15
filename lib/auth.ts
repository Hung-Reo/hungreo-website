/**
 * NextAuth v5 configuration
 * Handles admin authentication with email + password
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Admin credentials
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'

// Password hash for Admin@123
// NOTE: Hardcoded because Vercel environment variables break bcrypt hashes ($ character issues)
// TO CHANGE PASSWORD:
// 1. Run: node -e "require('bcryptjs').hash('YOUR_NEW_PASSWORD', 10).then(console.log)"
// 2. Replace the hash below with the new hash
// 3. Commit and deploy
const ADMIN_PASSWORD_HASH = '$2b$10$AtE9SRSkrQ0ClwQi7OLY3OlWYvcgTR7k2bABJBUyW9PU.pb1Ss612'

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
          return null
        }

        // Check if email matches admin email
        if (credentials.email !== ADMIN_EMAIL) {
          return null
        }

        // Verify password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          ADMIN_PASSWORD_HASH
        )

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
