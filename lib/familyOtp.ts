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
  /** Replaces any earlier code for the key; attempts start again at 0. */
  put(key: string, record: OtpRecord, ttlSeconds: number): Promise<void>
  /**
   * Compare, count a wrong try and burn in ONE atomic step. Read-then-write in
   * app code let a verify racing a newly issued code reuse the old code and
   * delete the new one (ISS-028).
   */
  consume(key: string, codeHash: string, now: number, maxAttempts: number): Promise<boolean>
}

// Lua runs atomically inside Redis. Comparing hashes of email:code there is fine:
// a timing difference reveals nothing usable about the code itself.
const PUT_SCRIPT = `
redis.call('DEL', KEYS[1])
redis.call('HSET', KEYS[1], 'codeHash', ARGV[1], 'attempts', 0, 'expiresAt', ARGV[2])
redis.call('EXPIRE', KEYS[1], ARGV[3])
return 1`

const CONSUME_SCRIPT = `
local r = redis.call('HMGET', KEYS[1], 'codeHash', 'attempts', 'expiresAt')
if not r[1] then return 0 end
if tonumber(r[3]) <= tonumber(ARGV[2]) then redis.call('DEL', KEYS[1]) return 0 end
if r[1] == ARGV[1] then redis.call('DEL', KEYS[1]) return 1 end
if tonumber(r[2]) + 1 >= tonumber(ARGV[3]) then redis.call('DEL', KEYS[1]) return 0 end
redis.call('HINCRBY', KEYS[1], 'attempts', 1)
return 0`

export const kvOtpStore: OtpStore = {
  put: async (key, record, ttlSeconds) => {
    await kv.eval(PUT_SCRIPT, [key], [record.codeHash, record.expiresAt, ttlSeconds])
  },
  consume: async (key, codeHash, now, maxAttempts) =>
    (await kv.eval<(string | number)[], number>(CONSUME_SCRIPT, [key], [codeHash, now, maxAttempts])) === 1,
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
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

// otp2: records are Redis hashes now; old `family:otp:` strings simply expire.
async function keyFor(email: string): Promise<string> {
  return `family:otp2:${await emailHash(email)}`
}

function codeHashFor(email: string, code: string): Promise<string> {
  return sha256(`${normalizeEmail(email)}:${code}`)
}

export async function issueOtp(store: OtpStore, email: string, now = Date.now()): Promise<string> {
  const code = randomCode()
  await store.put(
    await keyFor(email),
    { codeHash: await codeHashFor(email, code), attempts: 0, expiresAt: now + OTP_TTL_SECONDS * 1000 },
    OTP_TTL_SECONDS
  )
  return code
}

export async function verifyOtp(store: OtpStore, email: string, code: string, now = Date.now()): Promise<boolean> {
  // Malformed input still counts as a wrong try; 'invalid' never hashes like a 6-digit code.
  const candidate = await codeHashFor(email, /^\d{6}$/.test(code) ? code : 'invalid')
  return store.consume(await keyFor(email), candidate, now, OTP_MAX_ATTEMPTS)
}
