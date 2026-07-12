#!/usr/bin/env tsx

import assert from 'assert'
import {
  collectVideoVectorIds,
  parseRepairArguments,
  replaceVectorSet,
  validateTranscript,
} from '../lib/videoVectorLifecycle'
import { transcriptStatusFromFailure } from '../lib/videoManager'

console.log('Running video vector lifecycle tests...\n')

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

async function main() {
  await test('collects tracked, metadata, and prefix vector IDs without duplicates', () => {
  assert.deepStrictEqual(
    collectVideoVectorIds(
      ['video_a_chunk_0', '__GENERATING__'],
      ['legacy-a', 'video_a_chunk_0'],
      ['video_a_v2_chunk_0']
    ),
    ['legacy-a', 'video_a_chunk_0', 'video_a_v2_chunk_0']
  )
})

  await test('repair CLI defaults to dry-run and requires an explicit target for writes', () => {
  assert.deepStrictEqual(parseRepairArguments([]), {
    apply: false,
    environment: undefined,
    videoId: undefined,
  })

  assert.throws(
    () => parseRepairArguments(['--apply', '--environment=production']),
    /--video-id/
  )
  assert.throws(
    () => parseRepairArguments(['--apply', '--video-id=abc']),
    /--environment/
  )

  assert.deepStrictEqual(
    parseRepairArguments([
      '--apply',
      '--environment=production',
      '--video-id=0-_js3fzvys',
    ]),
    {
      apply: true,
      environment: 'production',
      videoId: '0-_js3fzvys',
    }
  )
})

  await test('validates transcript size before creating billable embeddings', () => {
  assert.throws(() => validateTranscript('   '), /empty/i)
  assert.throws(
    () => validateTranscript('word '.repeat(100_001)),
    /100000 words/
  )
  assert.strictEqual(validateTranscript('hello world').words, 2)
})

  await test('maps transcript failures to actionable persisted states', () => {
  assert.strictEqual(transcriptStatusFromFailure('NO_CAPTIONS'), 'no_captions')
  assert.strictEqual(transcriptStatusFromFailure('RATE_LIMITED'), 'blocked')
  assert.strictEqual(transcriptStatusFromFailure('BLOCKED'), 'blocked')
  assert.strictEqual(transcriptStatusFromFailure('UPSTREAM_ERROR'), 'failed')
})

  await test('keeps old vectors until the complete staged set is saved', async () => {
  const events: string[] = []

  const result = await replaceVectorSet({
    chunks: ['one', 'two'],
    previousIds: ['old-0', 'orphan-0'],
    makeVectorId: (index) => `new-${index}`,
    upsertChunk: async ({ id }) => {
      events.push(`upsert:${id}`)
    },
    saveVectorIds: async (ids) => {
      events.push(`save:${ids.join(',')}`)
    },
    deleteVectors: async (ids) => {
      events.push(`delete:${ids.join(',')}`)
    },
  })

  assert.deepStrictEqual(result.vectorIds, ['new-0', 'new-1'])
  assert.deepStrictEqual(events, [
    'upsert:new-0',
    'upsert:new-1',
    'save:new-0,new-1',
    'delete:old-0,orphan-0',
  ])
})

  await test('rolls back partial staged vectors and never switches KV', async () => {
  const events: string[] = []

  await assert.rejects(
    replaceVectorSet({
      chunks: ['one', 'two'],
      previousIds: ['old-0'],
      makeVectorId: (index) => `new-${index}`,
      upsertChunk: async ({ id, index }) => {
        events.push(`upsert:${id}`)
        if (index === 1) throw new Error('embedding failed')
      },
      saveVectorIds: async () => {
        events.push('save')
      },
      deleteVectors: async (ids) => {
        events.push(`delete:${ids.join(',')}`)
      },
    }),
    /embedding failed/
  )

  assert.deepStrictEqual(events, [
    'upsert:new-0',
    'upsert:new-1',
    'delete:new-0,new-1',
  ])
})

  await test('rolls back the complete staged set when switching KV fails', async () => {
  const events: string[] = []

  await assert.rejects(
    replaceVectorSet({
      chunks: ['one', 'two'],
      previousIds: ['old-0'],
      makeVectorId: (index) => `new-${index}`,
      upsertChunk: async ({ id }) => {
        events.push(`upsert:${id}`)
      },
      saveVectorIds: async () => {
        events.push('save')
        throw new Error('KV save failed')
      },
      deleteVectors: async (ids) => {
        events.push(`delete:${ids.join(',')}`)
      },
    }),
    /KV save failed/
  )

  assert.deepStrictEqual(events, [
    'upsert:new-0',
    'upsert:new-1',
    'save',
    'delete:new-0,new-1',
  ])
})

  await test('does not roll back vectors when KV committed before returning an error', async () => {
  const events: string[] = []

  const result = await replaceVectorSet({
    chunks: ['one'],
    previousIds: ['old-0'],
    makeVectorId: () => 'new-0',
    upsertChunk: async ({ id }) => {
      events.push(`upsert:${id}`)
    },
    saveVectorIds: async () => {
      events.push('save')
      throw new Error('connection closed after commit')
    },
    verifySavedVectorIds: async (ids) => {
      events.push(`verify:${ids.join(',')}`)
      return true
    },
    deleteVectors: async (ids) => {
      events.push(`delete:${ids.join(',')}`)
    },
  })

  assert.deepStrictEqual(result.vectorIds, ['new-0'])
  assert.deepStrictEqual(events, [
    'upsert:new-0',
    'save',
    'verify:new-0',
    'delete:old-0',
  ])
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
