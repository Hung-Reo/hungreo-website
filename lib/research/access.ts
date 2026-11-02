/**
 * Who may open /family/*. Pure functions so middleware and pages share one rule
 * and tests can pin it. Readers are family members who signed in with an emailed
 * code; their email is checked against FAMILY_READER_EMAILS on every request, so
 * removing it revokes access even while the 30-day session cookie is still valid.
 */

import type { CardStatus } from './questions'

export type Role = 'admin' | 'reader'

export interface SessionLike {
  role?: unknown
  email?: unknown
}

export function parseAllowlist(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(/[,;\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
  )
}

export function familyAllowlist(): Set<string> {
  return parseAllowlist(process.env.FAMILY_READER_EMAILS)
}

export function viewerRole(user: SessionLike | null | undefined, allowlist: Set<string>): Role | null {
  if (!user) return null
  if (user.role === 'admin') return 'admin'
  if (user.role === 'reader' && typeof user.email === 'string' && allowlist.has(user.email.toLowerCase())) {
    return 'reader'
  }
  return null
}

export function familyAccess(
  pathname: string,
  user: SessionLike | null | undefined,
  allowlist: Set<string>
): 'allow' | 'login' {
  if (pathname !== '/family' && !pathname.startsWith('/family/')) {
    throw new Error(`familyAccess called for ${pathname}`)
  }
  if (pathname === '/family/login') return 'allow'
  return viewerRole(user, allowlist) ? 'allow' : 'login'
}

/** Readers see only cards Hưng approved; anything unclear stays hidden. */
export function readerCanSee(status: CardStatus | undefined): boolean {
  return status === 'approved'
}
