#!/usr/bin/env tsx

import assert from 'assert'
import type { TranscriptFetchResult } from '../lib/videoManager'
import { trySupadataTranscriptFallback } from '../lib/supadataTranscript'

console.log('Running video transcript fallback tests...\n')

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

const blockedResult: TranscriptFetchResult = {
  ok: false,
  code: 'BLOCKED',
  retryable: true,
  message: 'YouTube blocked the transcript request.',
}

async function main() {
  await test('keeps a successful primary transcript without calling fallback', async () => {
    let calls = 0
    const primary: TranscriptFetchResult = {
      ok: true,
      transcript: 'primary transcript',
      language: 'en',
      source: 'caption-track',
    }

    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: primary,
      apiKey: 'test-key',
      fetchImpl: async () => {
        calls++
        throw new Error('fallback should not run')
      },
    })

    assert.deepStrictEqual(result, primary)
    assert.strictEqual(calls, 0)
  })

  await test('keeps the primary failure when fallback is not configured', async () => {
    let calls = 0
    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: blockedResult,
      apiKey: '',
      fetchImpl: async () => {
        calls++
        throw new Error('fallback should not run')
      },
    })

    assert.deepStrictEqual(result, blockedResult)
    assert.strictEqual(calls, 0)
  })

  await test('fetches a native transcript from the fixed Supadata endpoint', async () => {
    let requestUrl = ''
    let requestInit: RequestInit | undefined

    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: blockedResult,
      apiKey: 'test-key',
      fetchImpl: async (input, init) => {
        requestUrl = String(input)
        requestInit = init
        return new Response(
          JSON.stringify({ content: 'fallback transcript', lang: 'en' }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      },
    })

    assert.strictEqual(result.ok, true)
    if (result.ok) {
      assert.strictEqual(result.transcript, 'fallback transcript')
      assert.strictEqual(result.language, 'en')
      assert.strictEqual(result.source, 'supadata-native')
    }

    const url = new URL(requestUrl)
    assert.strictEqual(url.origin, 'https://api.supadata.ai')
    assert.strictEqual(url.pathname, '/v1/transcript')
    assert.strictEqual(url.searchParams.get('url'), 'https://www.youtube.com/watch?v=O8_isifBeKk')
    assert.strictEqual(url.searchParams.get('mode'), 'native')
    assert.strictEqual(url.searchParams.get('text'), 'true')
    assert.strictEqual(new Headers(requestInit?.headers).get('x-api-key'), 'test-key')
  })

  await test('maps transcript unavailable to NO_CAPTIONS', async () => {
    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: blockedResult,
      apiKey: 'test-key',
      fetchImpl: async () => new Response('', { status: 206 }),
    })

    assert.deepStrictEqual(result, {
      ok: false,
      code: 'NO_CAPTIONS',
      retryable: false,
      message: 'No caption tracks are available for this video.',
    })
  })

  await test('maps provider throttling to a retryable rate limit', async () => {
    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: blockedResult,
      apiKey: 'test-key',
      fetchImpl: async () => new Response('', { status: 429 }),
    })

    assert.deepStrictEqual(result, {
      ok: false,
      code: 'RATE_LIMITED',
      retryable: true,
      message: 'Transcript provider rate-limited the request.',
    })
  })

  await test('treats an asynchronous provider job as retryable', async () => {
    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: blockedResult,
      apiKey: 'test-key',
      fetchImpl: async () =>
        new Response(JSON.stringify({ jobId: 'job-123' }), { status: 202 }),
    })

    assert.deepStrictEqual(result, {
      ok: false,
      code: 'UPSTREAM_ERROR',
      retryable: true,
      message: 'Transcript provider is still processing this video.',
    })
  })

  await test('rejects malformed provider data without leaking the API key', async () => {
    const apiKey = 'secret-must-not-leak'
    const result = await trySupadataTranscriptFallback({
      videoId: 'O8_isifBeKk',
      primaryResult: blockedResult,
      apiKey,
      fetchImpl: async () => new Response(JSON.stringify({ content: 123 }), { status: 200 }),
    })

    assert.strictEqual(result.ok, false)
    if (!result.ok) {
      assert.strictEqual(result.code, 'UPSTREAM_ERROR')
      assert.ok(!result.message.includes(apiKey))
    }
  })

  console.log(`\nTotal: ${passed + failed}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
