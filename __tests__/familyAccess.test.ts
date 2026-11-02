#!/usr/bin/env tsx

import assert from 'assert'
import { familyAccess, parseAllowlist, readerCanSee } from '../lib/research/access'
import { issueOtp, verifyOtp, OTP_TTL_SECONDS, OTP_MAX_ATTEMPTS, type OtpStore, type OtpRecord } from '../lib/familyOtp'

console.log('Running family access tests...\n')

let passed = 0
let failed = 0
const pending: Promise<void>[] = []

function test(name: string, fn: () => void | Promise<void>) {
  pending.push(
    (async () => {
      try {
        await fn()
        console.log(`PASS ${name}`)
        passed++
      } catch (error) {
        console.log(`FAIL ${name}`)
        console.error(`   ${error instanceof Error ? error.message : error}`)
        failed++
      }
    })()
  )
}

const ALLOW = parseAllowlist(' Mom@Example.com, dad@example.com;bad-entry ,, ')

test('allowlist: normalised, invalid entries dropped', () => {
  assert.deepStrictEqual([...ALLOW].sort(), ['dad@example.com', 'mom@example.com'])
  assert.strictEqual(parseAllowlist(undefined).size, 0)
})

test('login page is always reachable', () => {
  assert.strictEqual(familyAccess('/family/login', null, ALLOW), 'allow')
})

test('anonymous visitor goes to login', () => {
  assert.strictEqual(familyAccess('/family/research', null, ALLOW), 'login')
  assert.strictEqual(familyAccess('/family/research/EDU-2026-W43_v1', {}, ALLOW), 'login')
})

test('admin is allowed', () => {
  assert.strictEqual(familyAccess('/family/research', { role: 'admin', email: 'x@y.z' }, ALLOW), 'allow')
})

test('reader on the allowlist is allowed, case-insensitive', () => {
  assert.strictEqual(familyAccess('/family/research', { role: 'reader', email: 'MOM@example.com' }, ALLOW), 'allow')
})

test('reader removed from the allowlist is blocked even with a live session', () => {
  assert.strictEqual(familyAccess('/family/research', { role: 'reader', email: 'aunt@example.com' }, ALLOW), 'login')
  assert.strictEqual(familyAccess('/family/research', { role: 'reader', email: 'mom@example.com' }, new Set()), 'login')
  assert.strictEqual(familyAccess('/family/research', { role: 'reader' }, ALLOW), 'login')
})

test('unknown roles are blocked', () => {
  assert.strictEqual(familyAccess('/family/research', { role: 'editor', email: 'mom@example.com' }, ALLOW), 'login')
})

test('only paths under /family are judged', () => {
  assert.throws(() => familyAccess('/admin/dashboard', { role: 'reader', email: 'mom@example.com' }, ALLOW))
  assert.throws(() => familyAccess('/familyx', null, ALLOW))
})

test('readers only see approved cards (fail-closed)', () => {
  assert.strictEqual(readerCanSee('approved'), true)
  for (const s of ['draft', 'dropped', 'unknown', undefined]) assert.strictEqual(readerCanSee(s as any), false)
})

// Mirrors the Lua in kvOtpStore: consume() runs with no await inside, so it is
// atomic here the same way the script is atomic inside Redis.
function memoryStore() {
  const data = new Map<string, OtpRecord>()
  const store: OtpStore = {
    async put(key, record) {
      data.set(key, { ...record, attempts: 0 })
    },
    async consume(key, codeHash, now, maxAttempts) {
      const r = data.get(key)
      if (!r) return false
      if (r.expiresAt <= now) return !data.delete(key)
      if (r.codeHash === codeHash) return data.delete(key)
      if (r.attempts + 1 >= maxAttempts) return !data.delete(key)
      r.attempts++
      return false
    },
  }
  return { store, data }
}

/** Holds every consume() until release(), to line up a race on purpose. */
function gated(store: OtpStore) {
  let release!: () => void
  const gate = new Promise<void>((r) => (release = r))
  const real = store.consume
  return {
    store: { ...store, consume: async (...args: Parameters<OtpStore['consume']>) => (await gate, real(...args)) },
    release,
  }
}

const T0 = 1_800_000_000_000

test('otp: issued code verifies once', async () => {
  const { store } = memoryStore()
  const code = await issueOtp(store, 'Mom@Example.com', T0)
  assert.match(code, /^\d{6}$/)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', code, T0 + 1000), true)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', code, T0 + 2000), false)
})

test('otp: the code itself is not stored', async () => {
  const { store, data } = memoryStore()
  const code = await issueOtp(store, 'mom@example.com', T0)
  const dump = JSON.stringify([...data.entries()])
  assert.ok(!dump.includes(code))
  assert.ok(!dump.includes('mom@example.com'))
})

test('otp: expires', async () => {
  const { store } = memoryStore()
  const code = await issueOtp(store, 'mom@example.com', T0)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', code, T0 + OTP_TTL_SECONDS * 1000 + 1), false)
})

test('otp: locked after max wrong attempts, even the right code fails', async () => {
  const { store } = memoryStore()
  const code = await issueOtp(store, 'mom@example.com', T0)
  const wrong = code === '000000' ? '111111' : '000000'
  for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
    assert.strictEqual(await verifyOtp(store, 'mom@example.com', wrong, T0 + i), false)
  }
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', code, T0 + 100), false)
})

test('otp: a new code replaces the old one', async () => {
  const { store } = memoryStore()
  const first = await issueOtp(store, 'mom@example.com', T0)
  let second = await issueOtp(store, 'mom@example.com', T0 + 10)
  while (second === first) second = await issueOtp(store, 'mom@example.com', T0 + 10)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', first, T0 + 20), false)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', second, T0 + 30), true)
})

test('otp: code for one email does not open another', async () => {
  const { store } = memoryStore()
  const code = await issueOtp(store, 'mom@example.com', T0)
  assert.strictEqual(await verifyOtp(store, 'dad@example.com', code, T0 + 1), false)
})

test('otp: a wrong guess racing a correct one cannot revive the used code', async () => {
  const { store } = memoryStore()
  const code = await issueOtp(store, 'mom@example.com', T0)
  const wrong = code === '000000' ? '111111' : '000000'
  const slow = gated(store)
  const late = verifyOtp(slow.store, 'mom@example.com', wrong, T0 + 1)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', code, T0 + 2), true)
  slow.release()
  assert.strictEqual(await late, false)
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', code, T0 + 3), false)
})

test('otp: same code sent many times at once wins exactly once', async () => {
  const { store } = memoryStore()
  const code = await issueOtp(store, 'mom@example.com', T0)
  const slow = gated(store)
  const tries = Array.from({ length: 5 }, () => verifyOtp(slow.store, 'mom@example.com', code, T0 + 1))
  slow.release()
  assert.strictEqual((await Promise.all(tries)).filter(Boolean).length, 1)
})

test('otp: old code in flight while a new one is issued: old fails, new still works (ISS-028)', async () => {
  const { store } = memoryStore()
  const first = await issueOtp(store, 'mom@example.com', T0)
  const slow = gated(store)
  const a = verifyOtp(slow.store, 'mom@example.com', first, T0 + 1)
  const b = verifyOtp(slow.store, 'mom@example.com', first, T0 + 1)
  let second = await issueOtp(store, 'mom@example.com', T0 + 2)
  while (second === first) second = await issueOtp(store, 'mom@example.com', T0 + 2)
  slow.release()
  assert.deepStrictEqual(await Promise.all([a, b]), [false, false])
  assert.strictEqual(await verifyOtp(store, 'mom@example.com', second, T0 + 3), true)
})

test('otp: malformed input is rejected', async () => {
  const { store } = memoryStore()
  await issueOtp(store, 'mom@example.com', T0)
  for (const bad of ['', '12345', '1234567', 'abcdef', ' 123456']) {
    assert.strictEqual(await verifyOtp(store, 'mom@example.com', bad, T0 + 1), false)
  }
})

Promise.all(pending).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
})
