#!/usr/bin/env tsx

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  parseTranslateRequest,
  parseTranslationResponse,
  compareMarkdownStructure,
  translateBlogFields,
  MAX_TRANSLATE_CONTENT,
} from '../lib/blogTranslator'
import { applyTranslation } from '../lib/applyTranslation'

console.log('Running blog translator tests...\n')

let passed = 0
let failed = 0
const pending: Promise<void>[] = []

function test(name: string, fn: () => void | Promise<void>) {
  const run = async () => {
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
  pending.push(run())
}

const ARTICLE = [
  '## Mở đầu',
  '',
  'Con hỏi: **robot có biết chơi không?** Xem [bài trước](https://hungreo.com/blog/a).',
  '',
  '### Ý chính',
  '',
  '- Một',
  '- Hai',
  '',
  '```ts',
  'const x = 1',
  '```',
  '',
  '![Ảnh](https://example.com/a.png)',
].join('\n')

const TRANSLATED = [
  '## Introduction',
  '',
  'My child asked: **can robots play?** See [previous post](https://hungreo.com/blog/a).',
  '',
  '### Key idea',
  '',
  '- One',
  '- Two',
  '',
  '```ts',
  'const x = 1',
  '```',
  '',
  '![Image](https://example.com/a.png)',
].join('\n')

function validRequest(extra: Record<string, unknown> = {}) {
  return { from: 'vi', to: 'en', title: 'Giáo dục thời AI', excerpt: 'Tóm tắt', content: ARTICLE, ...extra }
}

test('request: accepts vi → en with title, excerpt, content', () => {
  const result = parseTranslateRequest(validRequest())
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.input.from, 'vi')
  assert.equal(result.input.to, 'en')
  assert.equal(result.input.content, ARTICLE)
})

test('request: rejects same or unknown languages', () => {
  assert.equal(parseTranslateRequest(validRequest({ to: 'vi' })).ok, false)
  assert.equal(parseTranslateRequest(validRequest({ from: 'fr' })).ok, false)
})

test('request: rejects when nothing to translate', () => {
  const result = parseTranslateRequest(validRequest({ title: ' ', excerpt: '', content: '' }))
  assert.equal(result.ok, false)
})

test('request: rejects content over the limit instead of truncating', () => {
  const result = parseTranslateRequest(validRequest({ content: 'a'.repeat(MAX_TRANSLATE_CONTENT + 1) }))
  assert.equal(result.ok, false)
  if (result.ok) return
  assert.match(result.error, /30,000/)
})

test('response: returns translated fields', () => {
  const raw = JSON.stringify({ title: 'Education in the AI era', excerpt: 'Summary', content: TRANSLATED })
  const result = parseTranslationResponse(raw, 'stop', validRequest() as any)
  assert.equal(result.title, 'Education in the AI era')
  assert.equal(result.content, TRANSLATED)
})

test('response: throws when the model was cut off (finish_reason=length)', () => {
  const raw = JSON.stringify({ title: 'T', excerpt: 'E', content: 'partial' })
  assert.throws(() => parseTranslationResponse(raw, 'length', validRequest() as any), /too long|cut off/i)
})

test('response: throws on invalid JSON', () => {
  assert.throws(() => parseTranslationResponse('not json', 'stop', validRequest() as any), /JSON/)
})

test('response: throws when content is missing although the source had content', () => {
  const raw = JSON.stringify({ title: 'T', excerpt: 'E', content: '' })
  assert.throws(() => parseTranslationResponse(raw, 'stop', validRequest() as any), /content/i)
})

test('response: empty source fields stay empty (no invented text)', () => {
  const raw = JSON.stringify({ title: 'T', excerpt: 'Invented', content: 'Invented body' })
  const result = parseTranslationResponse(raw, 'stop', validRequest({ excerpt: '', content: '' }) as any)
  assert.equal(result.excerpt, '')
  assert.equal(result.content, '')
})

test('apply: keeps target fields whose source was empty (editor ignores empty content)', () => {
  const current = { title: 'Old EN title', excerpt: 'Old EN excerpt', content: '## Old body' }
  const merged = applyTranslation(current, { title: 'New title', excerpt: '', content: '' })
  assert.deepEqual(merged, { title: 'New title', excerpt: 'Old EN excerpt', content: '## Old body' })
})

test('apply: fills every field the translation returned', () => {
  const merged = applyTranslation(undefined, { title: 'T', excerpt: 'E', content: 'C' })
  assert.deepEqual(merged, { title: 'T', excerpt: 'E', content: 'C' })
})

test('structure: identical Markdown structure gives no warnings', () => {
  assert.deepEqual(compareMarkdownStructure(ARTICLE, TRANSLATED), [])
})

test('structure: warns when headings, links, images or code blocks change', () => {
  const broken = TRANSLATED.replace('### Key idea', 'Key idea')
    .replace('[previous post](https://hungreo.com/blog/a)', 'previous post')
    .replace('![Image](https://example.com/a.png)', '')
    .replace(/```ts\nconst x = 1\n```/, 'const x = 1')
  const warnings = compareMarkdownStructure(ARTICLE, broken)
  assert.equal(warnings.length, 4)
})

test('translate: calls the model once with JSON mode and returns fields + warnings', async () => {
  const calls: any[] = []
  const fakeClient = {
    chat: {
      completions: {
        create: async (args: any) => {
          calls.push(args)
          return {
            choices: [{
              finish_reason: 'stop',
              message: { content: JSON.stringify({ title: 'Education in the AI era', excerpt: 'Summary', content: TRANSLATED }) },
            }],
          }
        },
      },
    },
  }
  const parsed = parseTranslateRequest(validRequest())
  assert.ok(parsed.ok)
  if (!parsed.ok) return
  const result = await translateBlogFields(parsed.input, fakeClient as any)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].max_completion_tokens, 32000)
  assert.equal(calls[0].max_tokens, undefined)
  assert.deepEqual(calls[0].response_format, { type: 'json_object' })
  assert.ok(JSON.stringify(calls[0].messages).includes('Vietnamese'))
  assert.equal(result.title, 'Education in the AI era')
  assert.deepEqual(result.warnings, [])
})

test('route is admin-only and uses the translator', () => {
  const source = readFileSync(join(process.cwd(), 'app/api/admin/content/blog/translate/route.ts'), 'utf8')
  for (const needle of ['auth()', "role !== 'admin'", 'parseTranslateRequest', 'translateBlogFields']) {
    assert.ok(source.includes(needle), `route must use ${needle}`)
  }
})

Promise.all(pending).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
})
