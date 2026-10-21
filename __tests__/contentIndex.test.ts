#!/usr/bin/env tsx

// MVP-3: saving a blog post or project updates the chatbot index (Pinecone) for
// that one page, so the admin no longer has to press "Scrape Website" by hand.
// Pinecone and the embedding call are faked; nothing reaches a real service.

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  pageVectorPrefix,
  buildBlogIndexDocument,
  buildProjectIndexDocument,
  syncContentIndex,
  type IndexDeps,
} from '../lib/contentIndex'
import { describeIndexResult } from '../lib/contentIndexStatus'

console.log('Running content index tests...\n')

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

function words(n: number, word = 'lorem') {
  return Array.from({ length: n }, (_, i) => `${word}${i}`).join(' ')
}

function blogPost(extra: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    slug: 'education-in-the-ai-era',
    status: 'published',
    en: { title: 'Education in the AI era', excerpt: 'From answers to understanding', content: '## Body\n\nEnglish body text.' },
    vi: { title: 'Giáo dục thời AI', excerpt: 'Từ trả lời đến hiểu', content: '## Thân bài\n\nNội dung tiếng Việt.' },
    structuredContent: {
      en: { context: 'An evening walk.', originalVoice: 'My own words.', aiEditorial: 'SECRET AI NOTE EN' },
      vi: { context: 'Đi dạo buổi tối.', originalVoice: 'Lời gốc của mình.', aiEditorial: 'GHI CHU AI BI MAT' },
    },
    thoughtEvolution: [{ id: 't1', date: '2026-10-20', noteEn: 'I now think X.', noteVi: 'Giờ mình nghĩ X.' }],
    uncertainties: [{ id: 'u1', question: 'PRIVATE QUESTION', resolved: true }],
    ...extra,
  } as any
}

function project(extra: Record<string, unknown> = {}) {
  return {
    id: 'pr1',
    slug: 'openclaw',
    status: 'published',
    en: { title: 'OpenClaw', description: 'Personal AI ops', content: 'Project body.' },
    vi: { title: 'OpenClaw', description: 'Vận hành AI cá nhân', content: 'Nội dung dự án.' },
    techStack: ['Next.js', 'Telegram'],
    learnings: ['Keep agents sandboxed'],
    ...extra,
  } as any
}

interface FakeIndex {
  vectors: Map<string, { metadata: Record<string, unknown> }>
  calls: string[]
  failEmbed?: boolean
  failDeletePrefix?: string
}

function fakeDeps(initialIds: string[] = []): { deps: IndexDeps; state: FakeIndex } {
  const state: FakeIndex = { vectors: new Map(initialIds.map((id) => [id, { metadata: {} }])), calls: [] }
  const deps: IndexDeps = {
    embed: async (texts: string[]) => {
      state.calls.push(`embed:${texts.length}`)
      if (state.failEmbed) throw new Error('embedding API down')
      return texts.map((text) => [text.length, 1, 2])
    },
    index: {
      listPaginated: async ({ prefix, paginationToken }: { prefix?: string; paginationToken?: string }) => {
        state.calls.push(`list:${prefix}`)
        const ids = [...state.vectors.keys()].filter((id) => id.startsWith(prefix || '')).sort()
        // Two pages to prove pagination is followed
        const page = paginationToken ? ids.slice(1) : ids.slice(0, 1)
        return {
          vectors: page.map((id) => ({ id })),
          pagination: !paginationToken && ids.length > 1 ? { next: 'page2' } : undefined,
        }
      },
      upsert: async (records: Array<{ id: string; metadata: Record<string, unknown> }>) => {
        for (const r of records) {
          state.calls.push(`upsert:${r.id}`)
          state.vectors.set(r.id, { metadata: r.metadata })
        }
      },
      deleteMany: async (ids: string[]) => {
        if (state.failDeletePrefix && ids.some((id) => id.startsWith(state.failDeletePrefix!))) {
          throw new Error('pinecone delete failed')
        }
        for (const id of ids) {
          state.calls.push(`delete:${id}`)
          state.vectors.delete(id)
        }
      },
    },
  }
  return { deps, state }
}

async function main() {
  await test('vector ids use the same scheme as the website scraper', () => {
    assert.equal(pageVectorPrefix('/blog/abc'), 'website__blog_abc_chunk_')
    assert.equal(pageVectorPrefix('/projects/openclaw'), 'website__projects_openclaw_chunk_')
  })

  await test('blog document has both languages and Hung\'s words, never AI notes or private fields', () => {
    const doc = buildBlogIndexDocument(blogPost())
    assert.equal(doc.page, '/blog/education-in-the-ai-era')
    for (const needle of ['Education in the AI era', 'English body text', 'Giáo dục thời AI', 'Nội dung tiếng Việt', 'My own words', 'Lời gốc của mình', 'An evening walk', 'I now think X', 'Giờ mình nghĩ X']) {
      assert.ok(doc.text.includes(needle), `missing ${needle}`)
    }
    for (const secret of ['SECRET AI NOTE EN', 'GHI CHU AI BI MAT', 'PRIVATE QUESTION']) {
      assert.ok(!doc.text.includes(secret), `must not index ${secret}`)
    }
  })

  await test('blog document skips an empty language instead of indexing blank labels', () => {
    const doc = buildBlogIndexDocument(blogPost({ en: { title: 'Only EN', excerpt: '', content: '' }, structuredContent: undefined, thoughtEvolution: [] }))
    assert.ok(doc.text.includes('Only EN'))
    assert.ok(doc.text.includes('Nội dung tiếng Việt'))
    assert.ok(!/Article\s*$/m.test(doc.text), 'no empty Article label')
  })

  await test('project document includes description, body, tech stack and learnings', () => {
    const doc = buildProjectIndexDocument(project())
    assert.equal(doc.page, '/projects/openclaw')
    for (const needle of ['Personal AI ops', 'Project body.', 'Nội dung dự án.', 'Next.js', 'Keep agents sandboxed']) {
      assert.ok(doc.text.includes(needle), `missing ${needle}`)
    }
  })

  await test('publishing indexes the page and removes leftover chunks of that page only', async () => {
    const prefix = pageVectorPrefix('/blog/education-in-the-ai-era')
    const { deps, state } = fakeDeps([`${prefix}0`, `${prefix}7`, 'website__blog_other_chunk_0', 'website__blog_education-in-the-ai-era-2_chunk_0'])
    const result = await syncContentIndex('blog', null, blogPost(), deps)
    assert.equal(result.status, 'updated')
    assert.ok(result.vectors >= 1)
    assert.ok(state.vectors.has(`${prefix}0`))
    assert.ok(!state.vectors.has(`${prefix}7`), 'stale chunk of this page removed')
    assert.ok(state.vectors.has('website__blog_other_chunk_0'), 'other page untouched')
    assert.ok(state.vectors.has('website__blog_education-in-the-ai-era-2_chunk_0'), 'page with longer slug untouched')
    const meta = state.vectors.get(`${prefix}0`)!.metadata
    assert.equal(meta.type, 'website')
    assert.equal(meta.vectorType, 'website')
    assert.equal(meta.page, '/blog/education-in-the-ai-era')
  })

  await test('stale chunks are deleted only after every new chunk is written', async () => {
    const prefix = pageVectorPrefix('/blog/education-in-the-ai-era')
    const { deps, state } = fakeDeps([`${prefix}9`])
    await syncContentIndex('blog', null, blogPost({ en: { title: 'T', excerpt: 'E', content: words(1200) } }), deps)
    const firstDelete = state.calls.findIndex((c) => c.startsWith('delete:'))
    const lastUpsert = state.calls.map((c) => c.startsWith('upsert:')).lastIndexOf(true)
    assert.ok(firstDelete > lastUpsert, 'delete must come after all upserts')
  })

  await test('embedding failure keeps the old vectors and reports failed without throwing', async () => {
    const prefix = pageVectorPrefix('/blog/education-in-the-ai-era')
    const { deps, state } = fakeDeps([`${prefix}0`, `${prefix}1`, `${prefix}2`, `${prefix}3`, `${prefix}4`])
    state.failEmbed = true
    const logError = console.error
    console.error = () => {} // syncContentIndex logs the failure it reports; expected here
    const result = await syncContentIndex('blog', blogPost(), blogPost({ en: { title: 'T', excerpt: 'E', content: words(1200) } }), deps).finally(() => {
      console.error = logError
    })
    assert.equal(result.status, 'failed')
    assert.match(result.error || '', /embedding API down/)
    assert.ok(!state.calls.some((c) => c.startsWith('delete:')), 'nothing deleted on failure')
  })

  await test('unpublishing removes the page vectors', async () => {
    const prefix = pageVectorPrefix('/blog/education-in-the-ai-era')
    const { deps, state } = fakeDeps([`${prefix}0`, `${prefix}1`])
    const result = await syncContentIndex('blog', blogPost(), blogPost({ status: 'draft' }), deps)
    assert.equal(result.status, 'removed')
    assert.equal(result.removed, 2)
    assert.equal(state.vectors.size, 0)
  })

  await test('deleting a published post removes its vectors', async () => {
    const prefix = pageVectorPrefix('/projects/openclaw')
    const { deps, state } = fakeDeps([`${prefix}0`])
    const result = await syncContentIndex('projects', project(), null, deps)
    assert.equal(result.status, 'removed')
    assert.equal(state.vectors.size, 0)
  })

  await test('slug change removes the old page and indexes the new one', async () => {
    const oldPrefix = pageVectorPrefix('/blog/old-slug')
    const { deps, state } = fakeDeps([`${oldPrefix}0`])
    const result = await syncContentIndex('blog', blogPost({ slug: 'old-slug' }), blogPost(), deps)
    assert.equal(result.status, 'updated')
    assert.ok(!state.vectors.has(`${oldPrefix}0`))
    assert.ok(state.vectors.has(`${pageVectorPrefix('/blog/education-in-the-ai-era')}0`))
  })

  await test('a retry after a failed unpublish still removes the page (before is already a draft)', async () => {
    const prefix = pageVectorPrefix('/blog/education-in-the-ai-era')
    const { deps, state } = fakeDeps([`${prefix}0`])
    const result = await syncContentIndex('blog', blogPost({ status: 'draft' }), blogPost({ status: 'draft' }), deps)
    assert.equal(result.status, 'removed')
    assert.equal(state.vectors.size, 0)
  })

  await test('slug change: a failed removal of the old page is reported with the new vectors counted', async () => {
    const oldPrefix = pageVectorPrefix('/blog/old-slug')
    const { deps, state } = fakeDeps([`${oldPrefix}0`])
    state.failDeletePrefix = oldPrefix
    const logError = console.error
    console.error = () => {}
    const result = await syncContentIndex('blog', blogPost({ slug: 'old-slug' }), blogPost(), deps).finally(() => {
      console.error = logError
    })
    assert.equal(result.status, 'failed')
    assert.ok(result.vectors > 0, 'new page was indexed')
    assert.ok(state.vectors.has(`${pageVectorPrefix('/blog/education-in-the-ai-era')}0`))
  })

  await test('malformed stored data is reported as failed, never thrown into the route', async () => {
    const { deps } = fakeDeps()
    const logError = console.error
    console.error = () => {}
    const result = await syncContentIndex('projects', null, project({ techStack: 'not-an-array' }), deps).finally(() => {
      console.error = logError
    })
    assert.equal(result.status, 'failed')
  })

  await test('HTML comments, script and style hidden from readers are not indexed', () => {
    const doc = buildBlogIndexDocument(blogPost({
      en: { title: 'T', excerpt: 'E', content: 'Visible <!-- hidden note --> text <script>steal()</script><style>.x{}</style> <b>bold</b>' },
    }))
    assert.ok(doc.text.includes('Visible'))
    assert.ok(doc.text.includes('bold'))
    for (const hidden of ['hidden note', 'steal()', '.x{}', '<b>']) {
      assert.ok(!doc.text.includes(hidden), `must not index ${hidden}`)
    }
  })

  await test('all chunks of a page are embedded in one batch call', async () => {
    const { deps, state } = fakeDeps()
    await syncContentIndex('blog', null, blogPost({ en: { title: 'T', excerpt: 'E', content: words(2000) } }), deps)
    const embedCalls = state.calls.filter((c) => c.startsWith('embed:'))
    assert.equal(embedCalls.length, 1)
    assert.ok(Number(embedCalls[0].split(':')[1]) > 1)
  })

  await test('a brand-new draft makes no Pinecone call', async () => {
    const { deps, state } = fakeDeps()
    const result = await syncContentIndex('blog', null, blogPost({ status: 'draft' }), deps)
    assert.equal(result.status, 'skipped')
    assert.equal(state.calls.length, 0)
  })

  await test('drafts are never indexed', async () => {
    const { deps, state } = fakeDeps()
    const result = await syncContentIndex('blog', null, blogPost({ status: 'draft' }), deps)
    assert.equal(result.status, 'skipped')
    assert.equal(state.calls.filter((c) => c.startsWith('upsert:')).length, 0)
  })

  await test('admin toast: success for updated/removed, warning for failed, nothing for drafts', () => {
    assert.equal(describeIndexResult({ status: 'updated', page: '/blog/a', vectors: 3, removed: 0 })?.kind, 'success')
    assert.equal(describeIndexResult({ status: 'removed', page: '/blog/a', vectors: 0, removed: 2 })?.kind, 'success')
    const failed = describeIndexResult({ status: 'failed', page: '/blog/a', vectors: 0, removed: 0, error: 'boom' })
    assert.equal(failed?.kind, 'warning')
    assert.match(failed?.message || '', /boom/)
    assert.equal(describeIndexResult({ status: 'skipped', vectors: 0, removed: 0 }), null)
    assert.equal(describeIndexResult(undefined), null)
  })

  await test('full and selective scrapes use the same CMS text for blog/project pages', () => {
    const source = readFileSync(join(process.cwd(), 'lib/websiteScraper.ts'), 'utf8')
    assert.equal((source.match(/await cmsIndexText\(page\.url\)/g) || []).length, 2)
    assert.ok(source.includes('buildBlogIndexDocument(post)') && source.includes('buildProjectIndexDocument(project)'))
  })

  await test('admin save/delete routes call the index sync', () => {
    for (const file of [
      'app/api/admin/content/blog/route.ts',
      'app/api/admin/content/blog/[id]/route.ts',
      'app/api/admin/content/projects/route.ts',
      'app/api/admin/content/projects/[id]/route.ts',
      'app/api/admin/cleanup-corrupt-posts/route.ts',
    ]) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      assert.ok(source.includes('syncContentIndex('), `${file} must call syncContentIndex`)
    }
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
