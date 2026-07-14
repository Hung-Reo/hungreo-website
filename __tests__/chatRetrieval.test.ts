#!/usr/bin/env tsx

import assert from 'assert'
import { resolveVideoRetrievalScope } from '../lib/chatRetrieval'

console.log('Running chat retrieval tests...\n')

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

const selfStudyVideo = {
  id: 'video_O8_isifBeKk_v1_chunk_0',
  score: 0.3728,
  metadata: {
    title: 'How to Teach Yourself Anything (The Self-Study Blueprint)',
    type: 'video',
    vectorType: 'video',
    videoId: 'O8_isifBeKk',
  },
}

test('scopes the reported Vietnamese title query to the matching video', () => {
  const scope = resolveVideoRetrievalScope({
    query:
      'Hello bạn, bạn cho chi tiết lesson learn của video của Self-study Blueprint nhé.',
    matches: [
      {
        id: 'unrelated-document',
        score: 0.51,
        metadata: { title: 'Learning Mindset', type: 'document' },
      },
      selfStudyVideo,
      { ...selfStudyVideo, id: 'video_O8_isifBeKk_v1_chunk_1' },
    ],
  })

  assert.deepStrictEqual(scope, {
    videoId: 'O8_isifBeKk',
    source: 'title',
  })
})

test('does not scope a generic request without a distinctive title match', () => {
  const scope = resolveVideoRetrievalScope({
    query: 'Cho mình lesson learn chi tiết của video nhé',
    matches: [selfStudyVideo],
  })

  assert.strictEqual(scope, undefined)
})

test('ignores matching titles from non-video vectors', () => {
  const scope = resolveVideoRetrievalScope({
    query: 'Cho mình lesson learn của Self-study Blueprint',
    matches: [
      {
        id: 'document-1',
        score: 0.8,
        metadata: {
          title: 'Self-study Blueprint',
          type: 'document',
          videoId: 'O8_isifBeKk',
        },
      },
    ],
  })

  assert.strictEqual(scope, undefined)
})

test('uses a validated page-context video ID before lexical discovery', () => {
  const scope = resolveVideoRetrievalScope({
    query: 'Video này có lesson learn gì?',
    pageContextVideoId: 'O8_isifBeKk',
    matches: [],
  })

  assert.deepStrictEqual(scope, {
    videoId: 'O8_isifBeKk',
    source: 'page-context',
  })
})

test('rejects an invalid page-context ID and falls back to safe title matching', () => {
  const scope = resolveVideoRetrievalScope({
    query: 'Tell me about the Self Study Blueprint',
    pageContextVideoId: "O8_isifBeKk' OR true",
    matches: [selfStudyVideo],
  })

  assert.deepStrictEqual(scope, {
    videoId: 'O8_isifBeKk',
    source: 'title',
  })
})

test('rejects malformed video IDs supplied through vector metadata', () => {
  const scope = resolveVideoRetrievalScope({
    query: 'Tell me about the Self Study Blueprint',
    matches: [
      {
        ...selfStudyVideo,
        metadata: {
          ...selfStudyVideo.metadata,
          videoId: "O8_isifBeKk' OR true",
        },
      },
    ],
  })

  assert.strictEqual(scope, undefined)
})

console.log(`\nTotal: ${passed + failed}`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

process.exit(failed > 0 ? 1 : 0)
