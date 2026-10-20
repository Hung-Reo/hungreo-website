#!/usr/bin/env tsx

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import { newJobId, resolveJobId } from '../lib/jobId'

console.log('Running job id tests...\n')

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

test('client id round-trips through the server resolver', () => {
  const id = newJobId('website-scrape')
  assert.equal(resolveJobId(id, 'website-scrape'), id)
})

test('wrong prefix, junk or missing ids fall back to a server id', () => {
  for (const bad of [newJobId('video-embedding'), 'website-scrape-../../etc', 'website-scrape-x', 42, null, undefined]) {
    const out = resolveJobId(bad, 'website-scrape')
    assert.notEqual(out, bad)
    assert.match(out, /^website-scrape-\d+$/)
  }
})

test('long-running routes accept the client job id', () => {
  for (const file of [
    'app/api/admin/scrape/route.ts',
    'app/api/admin/vectors/website/scrape/route.ts',
    'app/api/admin/documents/upload/route.ts',
    'app/api/admin/documents/approve/route.ts',
    'app/api/admin/documents/[id]/route.ts',
    'app/api/admin/videos/[id]/route.ts',
  ]) {
    const source = readFileSync(join(process.cwd(), file), 'utf8')
    assert.ok(source.includes('resolveJobId('), `${file} must use resolveJobId`)
  }
})

test('progress stream waits for a job that is not created yet', () => {
  const source = readFileSync(join(process.cwd(), 'app/api/stream/[id]/route.ts'), 'utf8')
  assert.ok(source.includes("type: 'waiting'"))
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
