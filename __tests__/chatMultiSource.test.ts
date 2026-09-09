import assert from 'node:assert/strict'
import {
  retrieveChatMatches,
  resolveVideoRetrievalScopes,
  extractVideoIdsFromHistory,
  type RetrievalMatchLike,
} from '../lib/chatRetrieval'

const video = (videoId: string, title: string, n: number): RetrievalMatchLike => ({
  id: `${videoId}-${n}`, score: 0.8 - n / 100,
  metadata: { vectorType: 'video', videoId, title, description: `Chunk ${n}` },
})
const a = Array.from({ length: 5 }, (_, n) => video('O8_isifBeKk', 'How to Teach Yourself Anything (The Self-Study Blueprint)', n))
const b = Array.from({ length: 5 }, (_, n) => video('abcdefghijk', 'What to teach when AI writes the code', n))
const c = Array.from({ length: 5 }, (_, n) => video('iLCDSY2XX7E', 'Vibe Coding Fundamentals In 33 minutes', n))
const doc = { id: 'doc-1', score: 0.9, metadata: { vectorType: 'document', documentId: 'doc-family', title: 'Văn Hóa Gia Đình', description: 'Learning and practice' } }
const discovery = [doc, ...b, ...a, ...c]
let failed = 0
let passed = 0
async function test(name: string, fn: () => void | Promise<void>) {
  try { await fn(); passed++; console.log(`PASS ${name}`) }
  catch (e) { failed++; console.error(`FAIL ${name}`, e instanceof Error ? e.message : e) }
}
const run = (query: string, extra = {}) => retrieveChatMatches({
  query, discoveryMatches: discovery,
  queryVideo: async (id) => [...a, ...b, ...c].filter(m => m.metadata?.videoId === id), ...extra,
})
async function main() {
  await test('comparison retains both named videos and global document', async () => {
    const result = await run('So sánh Self-study Blueprint với What to teach when AI writes the code')
    for (const id of ['O8_isifBeKk', 'abcdefghijk']) assert.ok(result.filter(m => m.metadata?.videoId === id).length >= 2)
    assert.ok(result.some(m => m.id === doc.id))
    assert.ok(result.length <= 8)
    assert.equal(new Set(result.map(m => m.id)).size, result.length)
  })
  await test('three named videos all survive the bounded context budget', async () => {
    const result = await run('Synthesize Self-study Blueprint, What to teach when AI writes the code, and Vibe Coding Fundamentals In 33 minutes')
    for (const id of ['O8_isifBeKk', 'abcdefghijk', 'iLCDSY2XX7E']) assert.ok(result.filter(m => m.metadata?.videoId === id).length >= 2)
    assert.ok(result.some(m => m.id === doc.id)); assert.ok(result.length <= 8)
  })
  await test('single video keeps depth while allowing a global source', async () => {
    const result = await run('Self-study Blueprint và Văn Hóa Gia Đình')
    assert.equal(result.filter(m => m.metadata?.videoId === 'O8_isifBeKk').length, 5)
    assert.ok(result.some(m => m.id === doc.id))
  })
  await test('one failed scope does not discard other scope or global results', async () => {
    const result = await run('Self-study Blueprint và What to teach when AI writes the code', {
      queryVideo: async (id: string) => { if (id === 'abcdefghijk') throw new Error('unavailable'); return a },
    })
    assert.ok(result.some(m => m.id === a[0].id)); assert.ok(result.some(m => m.id === doc.id))
  })
  await test('no title match keeps existing global top five without scoped requests', async () => {
    const result = await run('Hưng là ai?', { queryVideo: async () => { throw new Error('must not call') } })
    assert.deepEqual(result, discovery.slice(0, 5))
  })
  await test('empty scopes fall back to global results', async () => {
    assert.deepEqual(await run('Self-study Blueprint', { queryVideo: async () => [] }), discovery.slice(0, 5))
  })
  await test('malformed page context never reaches scoped query', async () => {
    let calls = 0
    await run('Hưng là ai?', { pageContextVideoId: "bad-id'", queryVideo: async () => { calls++; return a } })
    assert.equal(calls, 0)
  })
  await test('page context is deduplicated and fan-out never exceeds three videos', async () => {
    const calls: string[] = []
    const result = await run('Self-study Blueprint, What to teach when AI writes the code, Vibe Coding Fundamentals In 33 minutes', {
      pageContextVideoId: '12345678901',
      queryVideo: async (id: string) => { calls.push(id); return [video(id, 'Scoped content', 0)] },
    })
    assert.equal(calls.length, 3)
    assert.equal(new Set(calls).size, 3)
    assert.ok(result.length <= 8)
  })
  await test('all failed scopes keep the exact global fallback', async () => {
    assert.deepEqual(await run('Self-study Blueprint', { queryVideo: async () => { throw new Error('unavailable') } }), discovery.slice(0, 5))
  })
  await test('empty discovery still retrieves a valid page-context video', async () => {
    const result = await run('Video này nói gì?', { discoveryMatches: [], pageContextVideoId: 'O8_isifBeKk' })
    assert.deepEqual(result, a)
  })
  await test('selection does not mutate the cached input arrays', async () => {
    const frozen = Object.freeze([...a])
    await run('Self-study Blueprint', { queryVideo: async () => frozen })
    assert.deepEqual(frozen, a)
    assert.equal(discovery.length, 16)
  })
  await test('follow-up recovers the videos the assistant just cited', async () => {
    // The question names nothing; only the previous answer knows the sources.
    const history = [
      { role: 'user', content: 'So sánh hai video đó' },
      { role: 'assistant', content: 'Xem [A](https://www.youtube.com/watch?v=O8_isifBeKk) và [B](https://youtu.be/abcdefghijk)' },
    ]
    const ids = extractVideoIdsFromHistory(history)
    assert.deepEqual(ids, ['O8_isifBeKk', 'abcdefghijk'])
    const result = await run('Vậy hai nguồn vừa so sánh khác nhau ở đâu khi áp dụng?', { historyVideoIds: ids })
    for (const id of ids) assert.ok(result.some(m => m.metadata?.videoId === id), `${id} phải có mặt`)
  })
  await test('history video IDs are read from assistant turns only', () => {
    const history = [
      { role: 'user', content: 'https://www.youtube.com/watch?v=aaaaaaaaaaa' },
      { role: 'assistant', content: 'https://www.youtube.com/watch?v=O8_isifBeKk' },
    ]
    assert.deepEqual(extractVideoIdsFromHistory(history), ['O8_isifBeKk'])
    assert.deepEqual(extractVideoIdsFromHistory(undefined), [])
  })
  await test('a named video outranks the video the visitor is watching', () => {
    const scopes = resolveVideoRetrievalScopes({
      query: 'Bỏ qua video đang xem. Tóm tắt What to teach when AI writes the code',
      pageContextVideoId: 'O8_isifBeKk', matches: discovery,
    })
    assert.equal(scopes[0].videoId, 'abcdefghijk')
    assert.equal(scopes[0].source, 'title')
    assert.ok(scopes.some(s => s.source === 'page-context'), 'video đang xem vẫn giữ một suất')
  })
  await test('page context stays primary when the question names nothing', () => {
    const scopes = resolveVideoRetrievalScopes({
      query: 'Video này nói về điều gì?', pageContextVideoId: 'O8_isifBeKk', matches: discovery,
    })
    assert.equal(scopes[0].source, 'page-context')
  })
  await test('malformed history IDs never reach a scoped query', () => {
    const scopes = resolveVideoRetrievalScopes({
      query: 'câu hỏi chung chung', matches: [], historyVideoIds: ['too-short', '../../etc/passwd', 'O8_isifBeKk'],
    })
    assert.deepEqual(scopes.map(s => s.videoId), ['O8_isifBeKk'])
  })
  console.log(`Multi-source: ${passed} passed, ${failed} failed`)
  process.exitCode = failed ? 1 : 0
}
main()
