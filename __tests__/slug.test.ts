#!/usr/bin/env tsx

// Creating or renaming a blog post/project must never take over another item's slug:
// the slug index would then point to the new item, the old URL would show the wrong
// post, and both would share one chatbot page (lib/contentIndex.ts).

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import { findAvailableSlug } from '../lib/slug'

console.log('Running slug tests...\n')

let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn()
    console.log(`PASS ${name}`)
    passed++
  } catch (error) {
    console.log(`FAIL ${name}`)
    console.error(`   ${error instanceof Error ? error.message : error}`)
    failed++
  }
}

function owners(map: Record<string, string>) {
  return async (slug: string) => map[slug] ?? null
}

async function main() {
  await test('keeps a free slug', async () => {
    assert.equal(await findAvailableSlug('nightbirde', 'id-new-1234', owners({})), 'nightbirde')
  })

  await test('keeps the slug the item already owns', async () => {
    assert.equal(await findAvailableSlug('nightbirde', 'id-a', owners({ nightbirde: 'id-a' })), 'nightbirde')
  })

  await test('adds the item id when another item owns the slug', async () => {
    const slug = await findAvailableSlug('nightbirde', 'abcdef12-3456', owners({ nightbirde: 'other-id' }))
    assert.equal(slug, 'nightbirde-abcdef12')
  })

  await test('keeps trying until the slug is free', async () => {
    const slug = await findAvailableSlug('x', 'abcdef12-3456', owners({ x: 'o1', 'x-abcdef12': 'o2' }))
    assert.equal(slug, 'x-abcdef12-2')
  })

  await test('falls back to a non-empty slug when the title had no latin characters', async () => {
    assert.equal(await findAvailableSlug('', 'abcdef12-3456', owners({})), 'post-abcdef12')
  })

  await test('blog and project create/update routes check slug ownership', () => {
    for (const file of [
      'app/api/admin/content/blog/route.ts',
      'app/api/admin/content/blog/[id]/route.ts',
      'app/api/admin/content/projects/route.ts',
      'app/api/admin/content/projects/[id]/route.ts',
    ]) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      assert.ok(source.includes('findAvailableSlug('), `${file} must use findAvailableSlug`)
    }
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
