#!/usr/bin/env tsx

// ISS-014 (docs/ISSUE_LOG.md): index rebuilds read every video through
// getAllVideosComplete(). If a transient KV read error were swallowed there, the
// rebuild would rewrite videos:all without that video and remove it from the site.
// A failed read must abort; only a genuinely missing record may be skipped.
// KV is stubbed at the fetch layer (Upstash REST); nothing reaches a real database.

import assert from 'assert'

process.env.KV_REST_API_URL = 'http://kv.test'
process.env.KV_REST_API_TOKEN = 'test-token'

console.log('Running video index read tests...\n')

let passed = 0
let failed = 0

async function test(name: string, fn: () => Promise<void>) {
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

function makeVideo(id: string) {
  return {
    id,
    videoId: id,
    url: `https://www.youtube.com/watch?v=${id}`,
    channelTitle: 'Channel',
    publishedAt: '2026-01-01',
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration: 'PT10M',
    category: 'AI Works',
    addedAt: 1,
    en: { title: `Title ${id}`, description: 'EN' },
    vi: { title: '', description: '' },
  }
}

interface FakeKv {
  ids: string[]
  records: Record<string, unknown>
  failingKeys: Set<string>
}

let fake: FakeKv = { ids: [], records: {}, failingKeys: new Set() }

function encode(value: unknown, base64: boolean): unknown {
  if (!base64) return value
  if (typeof value === 'string') return Buffer.from(value, 'utf8').toString('base64')
  if (Array.isArray(value)) return value.map((v) => encode(v, base64))
  return value
}

function runCommand([op, ...args]: string[]): { result?: unknown; error?: string } {
  switch (op.toLowerCase()) {
    case 'zrange': {
      const [, start, stop] = args.map(Number)
      return { result: fake.ids.slice(start, stop + 1) }
    }
    case 'get': {
      const record = fake.records[args[0]]
      return { result: record === undefined ? null : JSON.stringify(record) }
    }
    default:
      return { error: `fake KV: unsupported command ${op}` }
  }
}

globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
  const body = JSON.parse(String(init?.body))
  const commands: string[][] = Array.isArray(body[0]) ? body : [body]
  // Simulates a transport-level failure (Upstash returns non-2xx, client throws without retry).
  if (commands.some(([op, key]) => op.toLowerCase() === 'get' && fake.failingKeys.has(key))) {
    return new Response(JSON.stringify({ error: 'simulated KV outage' }), { status: 500 })
  }
  const headers = new Headers(init?.headers)
  const base64 = headers.get('upstash-encoding') === 'base64'
  const results = commands.map((cmd) => {
    const out = runCommand(cmd)
    return out.error ? out : { result: encode(out.result, base64) }
  })
  return new Response(JSON.stringify(Array.isArray(body[0]) ? results : results[0]), { status: 200 })
}) as typeof fetch

async function main() {
  const { getAllVideosComplete, getVideo } = await import('../lib/videoManager')

  const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc']
  const reset = () => {
    fake = {
      ids: [...ids],
      records: Object.fromEntries(ids.map((id) => [`video:${id}`, makeVideo(id)])),
      failingKeys: new Set(),
    }
  }

  await test('reads every video when KV is healthy', async () => {
    reset()
    const videos = await getAllVideosComplete()
    assert.deepEqual(videos.map((v) => v.id), ids)
  })

  await test('getAllVideosComplete throws on a read error instead of returning a shorter list', async () => {
    reset()
    fake.failingKeys.add('video:bbbbbbbbbbb')
    await assert.rejects(getAllVideosComplete(), /simulated KV outage/)
  })

  await test('getVideo still returns null on the same error so pages keep rendering', async () => {
    reset()
    fake.failingKeys.add('video:bbbbbbbbbbb')
    const logError = console.error
    console.error = () => {} // getVideo logs the swallowed error; expected here
    try {
      assert.equal(await getVideo('bbbbbbbbbbb'), null)
    } finally {
      console.error = logError
    }
  })

  await test('a genuinely missing record (orphan ID) is skipped, not an error', async () => {
    reset()
    delete fake.records['video:bbbbbbbbbbb']
    const videos = await getAllVideosComplete()
    assert.deepEqual(videos.map((v) => v.id), ['aaaaaaaaaaa', 'ccccccccccc'])
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
