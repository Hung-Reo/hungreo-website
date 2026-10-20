#!/usr/bin/env tsx

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  checkIngestToken,
  buildIngestDraft,
  PRIVACY_CHECK_ID,
} from '../lib/thoughtIngest'
import { getPublishBlockError } from '../lib/livingThought'

console.log('Running thought ingest tests...\n')

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

const TOKEN = 'test-token-0123456789abcdef0123456789'

function validBody(extra: Record<string, unknown> = {}) {
  return {
    externalId: 'telegram:1428',
    occurredAt: '2026-10-18',
    en: { title: 'A question from my child', excerpt: 'About robots and playing tag' },
    vi: { title: 'Câu hỏi của con', excerpt: 'Về robot và trò đuổi bắt' },
    structuredContent: {
      vi: { context: 'Đi dạo', originalVoice: 'Lời gốc', aiEditorial: 'Ghi chú AI' },
      en: { context: 'A walk', originalVoice: 'Original words', aiEditorial: 'AI notes' },
    },
    uncertainties: [{ question: 'Nêu tên dự án?' }],
    tags: ['Giao Duc Con', 'ai_agent'],
    ...extra,
  }
}

test('token: fails closed when the server has no token configured', () => {
  assert.equal(checkIngestToken(`Bearer ${TOKEN}`, undefined), 'not-configured')
  assert.equal(checkIngestToken(`Bearer ${TOKEN}`, ''), 'not-configured')
  assert.equal(checkIngestToken(`Bearer ${TOKEN}`, 'short'), 'not-configured')
})

test('token: rejects missing or wrong bearer token', () => {
  assert.equal(checkIngestToken(null, TOKEN), 'unauthorized')
  assert.equal(checkIngestToken(TOKEN, TOKEN), 'unauthorized')
  assert.equal(checkIngestToken('Bearer wrong', TOKEN), 'unauthorized')
  assert.equal(checkIngestToken(`Bearer ${TOKEN}x`, TOKEN), 'unauthorized')
})

test('token: accepts the exact bearer token', () => {
  assert.equal(checkIngestToken(`Bearer ${TOKEN}`, TOKEN), 'ok')
})

test('draft: always draft, never featured, attributed to openclaw', () => {
  const result = buildIngestDraft(validBody({ status: 'published', featured: true, createdBy: 'admin' }), 'id-1', 1000)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.post.status, 'draft')
  assert.equal(result.post.featured, false)
  assert.equal(result.post.createdBy, 'openclaw')
  assert.equal(result.post.publishedAt, undefined)
})

test('draft: keeps living thought fields and adds the privacy check', () => {
  const result = buildIngestDraft(validBody(), 'id-1', 1000)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.post.occurredAt, '2026-10-18')
  assert.equal(result.post.structuredContent?.vi.originalVoice, 'Lời gốc')
  const ids = (result.post.uncertainties || []).map((u) => u.id)
  assert.ok(ids.includes(PRIVACY_CHECK_ID))
  assert.ok((result.post.uncertainties || []).every((u) => u.resolved === false))
  assert.ok(getPublishBlockError({ ...result.post, status: 'published' }))
})

test('draft: client cannot pre-resolve the privacy check', () => {
  const result = buildIngestDraft(
    validBody({ uncertainties: [{ id: PRIVACY_CHECK_ID, question: 'x', resolved: true }] }),
    'id-1',
    1000
  )
  assert.ok(result.ok)
  if (!result.ok) return
  const privacy = (result.post.uncertainties || []).filter((u) => u.id === PRIVACY_CHECK_ID)
  assert.equal(privacy.length, 1)
  assert.equal(privacy[0].resolved, false)
})

test('draft: incoming uncertainties are always unresolved', () => {
  const result = buildIngestDraft(validBody({ uncertainties: [{ question: 'Q', resolved: true }] }), 'id-1', 1000)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.ok((result.post.uncertainties || []).every((u) => u.resolved === false))
})

test('draft: rejects missing required fields and bad externalId', () => {
  assert.equal(buildIngestDraft(validBody({ en: { title: '', excerpt: 'x' } }), 'id', 1).ok, false)
  assert.equal(buildIngestDraft(validBody({ vi: undefined }), 'id', 1).ok, false)
  assert.equal(buildIngestDraft(validBody({ externalId: '../../x' }), 'id', 1).ok, false)
  assert.equal(buildIngestDraft(validBody({ externalId: undefined }), 'id', 1).ok, false)
  assert.equal(buildIngestDraft('junk', 'id', 1).ok, false)
})

test('draft: requires living thought fields or article content', () => {
  assert.equal(buildIngestDraft(validBody({ structuredContent: undefined }), 'id', 1).ok, false)
})

test('article: markdown content alone is accepted and kept verbatim', () => {
  const md = '## Heading\n\nMột đoạn **đậm** [link](https://example.com).'
  const result = buildIngestDraft(
    validBody({ structuredContent: undefined, vi: { title: 'Bài', excerpt: 'Tóm tắt', content: md } }),
    'id-1',
    1000
  )
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.post.vi.content, md)
  assert.equal(result.post.en.content, '')
  assert.equal(result.post.structuredContent, undefined)
  assert.equal(result.post.status, 'draft')
  assert.ok((result.post.uncertainties || []).some((u) => u.id === PRIVACY_CHECK_ID))
})

test('article: readTime follows the content length', () => {
  const md = Array.from({ length: 1000 }, () => 'chữ').join(' ')
  const result = buildIngestDraft(
    validBody({ structuredContent: undefined, vi: { title: 'Bài', excerpt: 'Tóm tắt', content: md } }),
    'id-1',
    1000
  )
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.post.readTime, 5)
})

test('article: oversized content is rejected, not truncated', () => {
  const md = 'a'.repeat(60_001)
  const result = buildIngestDraft(
    validBody({ structuredContent: undefined, vi: { title: 'Bài', excerpt: 'Tóm tắt', content: md } }),
    'id-1',
    1000
  )
  assert.equal(result.ok, false)
})

test('draft: tags are normalized and capped', () => {
  const many = Array.from({ length: 20 }, (_, i) => `Tag ${i}`)
  const result = buildIngestDraft(validBody({ tags: many }), 'id-1', 1000)
  assert.ok(result.ok)
  if (!result.ok) return
  assert.equal(result.post.tags.length, 10)
  assert.equal(result.post.tags[0], 'tag-0')
})

test('ingest route checks token, rate limit, idempotency and slug clashes', () => {
  const source = readFileSync(join(process.cwd(), 'app/api/ingest/thought/route.ts'), 'utf8')
  for (const needle of ['checkIngestToken', 'thoughtIngestRateLimit', 'ingest:thought:', 'getBlogPostBySlug']) {
    assert.ok(source.includes(needle), `route must use ${needle}`)
  }
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
