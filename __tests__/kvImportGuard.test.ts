#!/usr/bin/env tsx

// ISS-006 (docs/ISSUE_LOG.md): stale data from caching happened 3 times. The stock
// `kv` from '@vercel/kv' fetches with cache: 'default', so Next keeps KV reads in the
// Data Cache forever. Runtime code must read KV through '@/lib/kv' (no-store).
// scripts/ run outside Next and are allowed to use '@vercel/kv' directly.

import assert from 'assert'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

console.log('Running KV import guard tests...\n')

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

const ROOT = process.cwd()
const RUNTIME_DIRS = ['app', 'lib', 'components', 'contexts', 'hooks']
const RUNTIME_FILES = ['middleware.ts']
const ALLOWED = new Set(['lib/kv.ts'])

// Value imports only: `import type { VercelKV } from '@vercel/kv'` cannot create a client.
const VALUE_IMPORT = /(?:^|\n)\s*import\s+(?!type\b)[^;]*?from\s*['"]@vercel\/kv['"]|require\(\s*['"]@vercel\/kv['"]\s*\)|import\(\s*['"]@vercel\/kv['"]\s*\)/

function sourceFiles(dir: string): string[] {
  const full = join(ROOT, dir)
  let entries: string[]
  try {
    entries = readdirSync(full)
  } catch {
    return []
  }
  return entries.flatMap((name) => {
    const path = join(full, name)
    if (statSync(path).isDirectory()) return sourceFiles(relative(ROOT, path))
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [relative(ROOT, path)] : []
  })
}

function findForbiddenKvImports(files: string[], read = (f: string) => readFileSync(join(ROOT, f), 'utf8')) {
  return files.filter((file) => !ALLOWED.has(file) && VALUE_IMPORT.test(read(file)))
}

test('detector flags value imports and ignores type-only imports', () => {
  const samples: Record<string, string> = {
    'a.ts': "import { kv } from '@vercel/kv'",
    'b.ts': 'const { kv } = require("@vercel/kv")',
    'c.ts': "const m = await import('@vercel/kv')",
    'd.ts': "import type { VercelKV } from '@vercel/kv'",
    'e.ts': "import { kv } from '@/lib/kv'",
    'lib/kv.ts': "import { createClient } from '@vercel/kv'",
  }
  const flagged = findForbiddenKvImports(Object.keys(samples), (f) => samples[f])
  assert.deepEqual(flagged, ['a.ts', 'b.ts', 'c.ts'])
})

test("runtime code imports kv only from '@/lib/kv'", () => {
  const files = [...RUNTIME_DIRS.flatMap(sourceFiles), ...RUNTIME_FILES]
  assert.ok(files.length > 50, `expected to scan the app, scanned ${files.length} files`)
  const offenders = findForbiddenKvImports(files)
  assert.deepEqual(offenders, [], `use "import { kv } from '@/lib/kv'" instead of '@vercel/kv' in: ${offenders.join(', ')}`)
})

test('lib/kv.ts keeps the no-store client', () => {
  const source = readFileSync(join(ROOT, 'lib/kv.ts'), 'utf8')
  assert.match(source, /cache:\s*'no-store'/)
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
