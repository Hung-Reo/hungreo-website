#!/usr/bin/env tsx

// Admin → Home: the "Building now / Learning now" block on the homepage is edited in
// the admin (KV) instead of being hard-coded translations that needed a deploy.

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import { DEFAULT_HOME_NOW, HOME_NOW_LIMITS, parseHomeNow } from '../lib/homeNow'

console.log('Running home now tests...\n')

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`PASS ${name}`)
    passed++
  } catch (error) {
    console.log(`FAIL ${name}`)
    console.error(`   ${error instanceof Error ? error.message : error}`)
    failed++
  }
}

const read = (file: string) => readFileSync(join(process.cwd(), file), 'utf8')

function valid(extra: Record<string, unknown> = {}) {
  return JSON.parse(JSON.stringify({ ...DEFAULT_HOME_NOW, ...extra }))
}

test('defaults keep the text that was live before this change (EN + VI)', () => {
  assert.equal(DEFAULT_HOME_NOW.en.updated, 'Updated October 2026')
  assert.equal(DEFAULT_HOME_NOW.vi.updated, 'Cập nhật tháng 10/2026')
  assert.match(DEFAULT_HOME_NOW.en.buildingP1, /^Through September and October, I've been building AI agents/)
  assert.match(DEFAULT_HOME_NOW.vi.learningP2, /^Song song, mình dành thời gian tìm hiểu sâu hơn về giáo dục/)
})

test('accepts the defaults and trims whitespace', () => {
  const body = valid()
  body.en.buildingP1 = `  ${body.en.buildingP1}  `
  const result = parseHomeNow(body)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.content.en.buildingP1, DEFAULT_HOME_NOW.en.buildingP1)
})

test('second paragraphs are optional (empty = hidden on the homepage)', () => {
  const body = valid()
  body.vi.buildingP2 = ''
  body.en.learningP2 = '   '
  const result = parseHomeNow(body)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.content.vi.buildingP2, '')
  assert.equal(result.content.en.learningP2, '')
})

test('rejects a missing date line or first paragraph in either language', () => {
  for (const [lang, field] of [['en', 'updated'], ['vi', 'buildingP1'], ['vi', 'learningP1']] as const) {
    const body = valid()
    body[lang][field] = ' '
    const result = parseHomeNow(body)
    assert.equal(result.ok, false, `${lang}.${field}`)
    if (!result.ok) assert.match(result.error, new RegExp(lang.toUpperCase()))
  }
})

test('rejects text over the limits instead of cutting it', () => {
  const body = valid()
  body.en.learningP1 = 'a'.repeat(HOME_NOW_LIMITS.paragraph + 1)
  assert.equal(parseHomeNow(body).ok, false)
  const body2 = valid()
  body2.vi.updated = 'a'.repeat(HOME_NOW_LIMITS.updated + 1)
  assert.equal(parseHomeNow(body2).ok, false)
})

test('drops unknown fields and non-string values', () => {
  const body = valid({ status: 'hacked' })
  body.en.extra = 'x'
  body.vi.learningP2 = 42
  const result = parseHomeNow(body)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.deepEqual(Object.keys(result.content).sort(), ['en', 'vi'])
  assert.deepEqual(Object.keys(result.content.en).sort(), ['buildingP1', 'buildingP2', 'learningP1', 'learningP2', 'updated'])
  assert.equal(result.content.vi.learningP2, '')
})

test('rejects a body that is not an object', () => {
  assert.equal(parseHomeNow(null).ok, false)
  assert.equal(parseHomeNow('text').ok, false)
})

test('the block text is no longer hard-coded in translations', () => {
  const source = read('contexts/LanguageContext.tsx')
  for (const key of ['home.now.updated', 'home.now.building.p1', 'home.now.building.p2', 'home.now.learning.p1', 'home.now.learning.p2']) {
    assert.ok(!source.includes(`'${key}'`), `${key} should come from lib/homeNow`)
  }
  assert.ok(source.includes("'home.now.building.title'"), 'titles and link labels stay in translations')
})

test('homepage reads the block on the server and passes it to the client', () => {
  const page = read('app/page.tsx')
  assert.ok(page.includes('getHomeNow()'))
  assert.ok(page.includes('DEFAULT_HOME_NOW'))
  const client = read('app/HomeClient.tsx')
  assert.ok(client.includes('now[language]'))
})

test('admin API is admin-only and validates with parseHomeNow', () => {
  const source = read('app/api/admin/content/home/route.ts')
  for (const needle of ['auth()', "role !== 'admin'", 'parseHomeNow(', 'saveHomeNow(']) {
    assert.ok(source.includes(needle), `route must use ${needle}`)
  }
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
