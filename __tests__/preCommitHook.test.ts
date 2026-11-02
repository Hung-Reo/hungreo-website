#!/usr/bin/env tsx

// ISS-027 (docs/ISSUE_LOG.md): the pre-commit secret guard was broken for its whole
// life and nobody noticed. These tests run .husky/pre-commit in a throwaway repo.
// Fake keys are built at runtime so this file itself passes the hook.

import assert from 'assert'
import { execFileSync, spawnSync } from 'child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

console.log('Running pre-commit hook tests...\n')

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

const HOOK = join(process.cwd(), '.husky', 'pre-commit')
const repo = mkdtempSync(join(tmpdir(), 'hook-test-'))
const git = (...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo, stdio: 'pipe' })
git('init', '-q')

function stage(file: string, content: string) {
  writeFileSync(join(repo, file), content)
  git('add', '-f', file)
}

function hookExit(): number {
  const status = spawnSync('sh', [HOOK], { cwd: repo, stdio: 'pipe' }).status ?? -1
  git('reset', '-q')
  return status
}

const fake = (prefix: string, n: number) => prefix + 'a'.repeat(n)

test('prepare script turns the hook on in every checkout', () => {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'))
  assert.match(pkg.scripts.prepare, /git config core\.hooksPath \.husky/)
})

test('clean code file passes', () => {
  stage('a.ts', 'export const x = 1\n')
  assert.strictEqual(hookExit(), 0)
})

test('API keys are blocked in code files, not only markdown', () => {
  for (const [file, key] of [
    ['b.ts', fake('sk-', 45)],
    ['c.yml', fake('ghp_', 36)],
    ['d.json', fake('re_', 32)],
  ]) {
    stage(file, `const k = '${key}'\n`)
    assert.strictEqual(hookExit(), 1, file)
  }
})

test('private key block is blocked', () => {
  stage('e.pem', `-----BEGIN RSA ${'PRIVATE'} KEY-----\n`)
  assert.strictEqual(hookExit(), 1)
})

test('env files are blocked, the example template is allowed', () => {
  stage('.env.local', 'X=1\n')
  assert.strictEqual(hookExit(), 1)
  stage('.env.example', 'X=YOUR_KEY_HERE\n')
  assert.strictEqual(hookExit(), 0)
})

test('password in markdown is blocked', () => {
  stage('f.md', 'Password: `Secret1234`\n')
  assert.strictEqual(hookExit(), 1)
})

test('removing a leaked key is not blocked', () => {
  stage('g.md', fake('re_', 32) + '\n')
  git('commit', '-q', '--no-verify', '-m', 'seed')
  git('rm', '-q', 'g.md')
  const status = spawnSync('sh', [HOOK], { cwd: repo, stdio: 'pipe' }).status
  assert.strictEqual(status, 0)
})

rmSync(repo, { recursive: true, force: true })

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
