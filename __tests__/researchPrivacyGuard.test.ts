#!/usr/bin/env tsx

// This repo is public. Research cards live in the private super-app repo and are read
// at runtime only; none may be committed here, and the card reader must stay locked to
// the research folder.

import assert from 'assert'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'

console.log('Running research privacy guard tests...\n')

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

test('no research card file is tracked in this repo', () => {
  const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n')
  const cards = files.filter((f) => /EDU-\d{4}-W\d{2}[a-z]?_v\d+\.md$/.test(f) || f.includes('docs/research/weekly'))
  assert.deepStrictEqual(cards, [])
})

test('card source reads only the research folder', () => {
  const src = readFileSync('lib/research/source.ts', 'utf8')
  assert.ok(src.includes("const REMOTE_DIR = 'docs/research/weekly'"))
  assert.ok(/isCardFileName|isAllowedFile/.test(src))
})

test('card content is never exposed through an API route', () => {
  const routes = execSync('git ls-files app/api', { encoding: 'utf8' }).split('\n').filter(Boolean)
  const offenders = routes.filter((f) => readFileSync(f, 'utf8').includes('lib/research/repository'))
  assert.deepStrictEqual(offenders, [])
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
