#!/usr/bin/env tsx

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  normalizeLivingThought,
  getUnresolvedUncertainties,
  getPublishBlockError,
} from '../lib/livingThought'
import { serializePublicBlogPost } from '../lib/contentManager'
import type { BlogPost } from '../lib/contentManager'

console.log('Running living thought tests...\n')

let passed = 0
let failed = 0

async function test(name: string, fn: () => void | Promise<void>) {
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

function makePost(extra: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'cau-hoi-cua-con',
    status: 'published',
    featured: false,
    createdAt: 1,
    updatedAt: 2,
    publishedAt: 3,
    createdBy: 'admin@example.com',
    en: { title: 'Title', excerpt: 'Excerpt text', content: '' },
    vi: { title: 'Tiêu đề', excerpt: 'Tóm tắt', content: '' },
    category: 'AI & Education',
    tags: ['giao_duc_con'],
    readTime: 1,
    source: { rawDraft: 'raw private draft', detectedLanguage: 'vi' },
    occurredAt: '2026-10-18',
    structuredContent: {
      en: { context: 'Evening walk', originalVoice: 'My words', aiEditorial: 'AI notes' },
      vi: { context: 'Đi dạo buổi tối', originalVoice: 'Lời của mình', aiEditorial: 'Ghi chú AI' },
    },
    thoughtEvolution: [{ id: 't1', date: '2026-11-02', noteVi: 'Đổi ý', noteEn: 'Changed my mind' }],
    uncertainties: [{ id: 'u1', question: 'Nêu tên dự án?', resolved: true }],
    ...extra,
  }
}

async function main() {
  await test('public serializer keeps living thought fields', () => {
    const pub = serializePublicBlogPost(makePost()) as unknown as Record<string, unknown>
    assert.equal(pub.occurredAt, '2026-10-18')
    assert.deepEqual(pub.structuredContent, makePost().structuredContent)
    assert.deepEqual(pub.thoughtEvolution, makePost().thoughtEvolution)
  })

  await test('public serializer strips private fields', () => {
    const pub = serializePublicBlogPost(makePost()) as unknown as Record<string, unknown>
    assert.equal(pub.uncertainties, undefined)
    assert.equal(pub.source, undefined)
    assert.equal(pub.createdBy, undefined)
    assert.ok(!JSON.stringify(pub).includes('Nêu tên dự án'))
    assert.ok(!JSON.stringify(pub).includes('raw private draft'))
  })

  await test('legacy post without living thought fields still serializes', () => {
    const legacy = makePost({
      occurredAt: undefined,
      structuredContent: undefined,
      thoughtEvolution: undefined,
      uncertainties: undefined,
    })
    const pub = serializePublicBlogPost(legacy) as unknown as Record<string, unknown>
    assert.equal(pub.structuredContent, undefined)
    assert.equal((pub.en as { title: string }).title, 'Title')
  })

  await test('normalize drops invalid shapes and dates', () => {
    const out = normalizeLivingThought({
      occurredAt: '18/10/2026',
      structuredContent: 'not an object',
      thoughtEvolution: [{ date: 'bad', noteVi: '' }, 'junk'],
      uncertainties: [{ question: '   ' }, 42],
    })
    assert.equal(out.occurredAt, undefined)
    assert.equal(out.structuredContent, undefined)
    assert.deepEqual(out.thoughtEvolution, [])
    assert.deepEqual(out.uncertainties, [])
  })

  await test('normalize trims text, fills ids and coerces resolved', () => {
    const out = normalizeLivingThought({
      occurredAt: '2026-10-18',
      structuredContent: { vi: { context: '  Bối cảnh  ', originalVoice: 'Lời gốc', aiEditorial: '' } },
      thoughtEvolution: [{ date: '2026-11-02', noteVi: ' Đổi ý ' }],
      uncertainties: [{ question: 'Nêu tên?', resolved: 'yes' }],
    })
    assert.equal(out.occurredAt, '2026-10-18')
    assert.equal(out.structuredContent?.vi.context, 'Bối cảnh')
    assert.deepEqual(out.structuredContent?.en, { context: '', originalVoice: '', aiEditorial: '' })
    assert.equal(out.thoughtEvolution?.[0].noteVi, 'Đổi ý')
    assert.ok(out.thoughtEvolution?.[0].id)
    assert.equal(out.uncertainties?.[0].resolved, false)
    assert.ok(out.uncertainties?.[0].id)
  })

  await test('normalize returns empty structured content as undefined', () => {
    const out = normalizeLivingThought({
      structuredContent: { en: { context: ' ' }, vi: { originalVoice: '' } },
    })
    assert.equal(out.structuredContent, undefined)
  })

  await test('normalize leaves absent fields absent so PUT keeps existing values', () => {
    const out = normalizeLivingThought({ occurredAt: '2026-10-18' })
    assert.ok(!('structuredContent' in out))
    assert.ok(!('thoughtEvolution' in out))
    assert.ok(!('uncertainties' in out))
  })

  await test('publish is blocked while an uncertainty is unresolved', () => {
    const post = makePost({ uncertainties: [{ id: 'u1', question: 'Nêu tên?', resolved: false }] })
    assert.equal(getUnresolvedUncertainties(post).length, 1)
    assert.ok(getPublishBlockError(post))
  })

  await test('draft with unresolved uncertainty can be saved', () => {
    const post = makePost({
      status: 'draft',
      uncertainties: [{ id: 'u1', question: 'Nêu tên?', resolved: false }],
    })
    assert.equal(getPublishBlockError(post), null)
  })

  await test('published post with all uncertainties resolved is allowed', () => {
    assert.equal(getPublishBlockError(makePost()), null)
    assert.equal(getPublishBlockError(makePost({ uncertainties: undefined })), null)
  })

  await test('admin blog routes enforce the publish gate', () => {
    for (const file of ['app/api/admin/content/blog/route.ts', 'app/api/admin/content/blog/[id]/route.ts']) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      assert.ok(source.includes('getPublishBlockError'), `${file} must call getPublishBlockError`)
      assert.ok(source.includes('normalizeLivingThought'), `${file} must normalize living thought fields`)
    }
  })

  await test('scraper skips sections marked data-index-exclude', () => {
    const source = readFileSync(join(process.cwd(), 'lib/websiteScraper.ts'), 'utf8')
    assert.ok(source.includes('[data-index-section]'))
    assert.ok(source.includes('[data-index-exclude]'))
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
