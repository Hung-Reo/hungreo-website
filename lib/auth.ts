/**
 * NextAuth v5 configuration
 * Handles admin authentication with email + password
 */

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Admin credentials (in production, use environment variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hungreo2005@gmail.com'
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ''

// If no hash is set, create one for default password 'admin123'
// In production, you MUST set ADMIN_PASSWORD_HASH in environment variables
const DEFAULT_PASSWORD_HASH = '$2b$10$05KUDdTtAhvYELphZhxeUOQZ0tNy08ACVz64jOJbLuSwJXW0gMSAK' // admin123

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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

        // Verify password
        const passwordHash = ADMIN_PASSWORD_HASH || DEFAULT_PASSWORD_HASH
        console.log('[Auth] Using hash:', passwordHash.substring(0, 10) + '...')
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
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
