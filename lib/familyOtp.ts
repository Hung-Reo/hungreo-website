/**
 * One-time 6-digit sign-in codes for family readers (/family/login).
 * The store keeps only hashes: the key is sha256(email), the value holds
 * sha256(email:code), so neither the address nor the code sits in KV.
 * A code lives 10 minutes, works once, and is burned after 5 wrong tries.
 *
 * Web Crypto only: lib/auth.ts imports this and middleware (Edge runtime)
 * imports lib/auth.ts, so Node's 'crypto' module is not available here.
 */

import { kv } from './kv'

export const OTP_TTL_SECONDS = 600
export const OTP_MAX_ATTEMPTS = 5

export interface OtpRecord {
  codeHash: string
  attempts: number
  expiresAt: number
}

export interface OtpStore {
  get(key: string): Promise<OtpRecord | null>
  set(key: string, value: OtpRecord, ttlSeconds: number): Promise<void>
  /** Write only if the key still exists, so a late wrong guess cannot revive a used code. */
  update(key: string, value: OtpRecord, ttlSeconds: number): Promise<void>
  /** Returns how many keys were removed, so only one verify can win a code. */
  del(key: string): Promise<number>
}

export const kvOtpStore: OtpStore = {
  get: (key) => kv.get<OtpRecord>(key),
  set: async (key, value, ttlSeconds) => {
    await kv.set(key, value, { ex: ttlSeconds })
  },
  update: async (key, value, ttlSeconds) => {
    await kv.set(key, value, { ex: ttlSeconds, xx: true })
  },
  del: (key) => kv.del(key),
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function randomCode(): string {
  // Rejection sampling keeps all 1,000,000 codes equally likely.
  const limit = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return (buf[0] % 1_000_000).toString().padStart(6, '0')
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Also used as the rate-limit identifier, so raw addresses stay out of KV. */
export function emailHash(email: string): Promise<string> {
  return sha256(normalizeEmail(email))
}

async function keyFor(email: string): Promise<string> {
  return `family:otp:${await emailHash(email)}`
}

function codeHashFor(email: string, code: string): Promise<string> {
  return sha256(`${normalizeEmail(email)}:${code}`)
}

export async function issueOtp(store: OtpStore, email: string, now = Date.now()): Promise<string> {
  const code = randomCode()
  await store.set(
    await keyFor(email),
    { codeHash: await codeHashFor(email, code), attempts: 0, expiresAt: now + OTP_TTL_SECONDS * 1000 },
    OTP_TTL_SECONDS
  )
  return code
}

export async function verifyOtp(store: OtpStore, email: string, code: string, now = Date.now()): Promise<boolean> {
  const key = await keyFor(email)
  const record = await store.get(key)
  if (!record) return false
  if (record.expiresAt <= now) {
    await store.del(key)
    return false
  }

  const wellFormed = /^\d{6}$/.test(code)
  const actual = await codeHashFor(email, wellFormed ? code : 'invalid')
  if (wellFormed && constantTimeEqual(record.codeHash, actual)) {
    return (await store.del(key)) === 1
  }

  const attempts = record.attempts + 1
  if (attempts >= OTP_MAX_ATTEMPTS) await store.del(key)
  else await store.update(key, { ...record, attempts }, Math.max(1, Math.ceil((record.expiresAt - now) / 1000)))
  return false
}
