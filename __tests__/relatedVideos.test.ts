#!/usr/bin/env tsx

import assert from 'assert'
import { loadRelatedVideos } from '../lib/relatedVideos'
import type { Video, VideoCategory } from '../lib/videoManager'

console.log('Running related videos tests...\n')

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

function makeVideo(id: string, extra: Record<string, unknown> = {}): Video {
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
    en: { title: `Title ${id}`, description: 'EN', transcript: 'secret transcript', summary: 'sum' },
    vi: { title: '', description: '', transcript: 'ban ghi', summary: undefined },
    translationStatus: { viTranslated: false },
    ...extra,
  } as unknown as Video
}

async function main() {
  await test('excludes the current video and keeps loader order up to the limit', async () => {
    const videos = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd'].map((id) => makeVideo(id))
    const related = await loadRelatedVideos('AI Works', 'bbbbbbbbbbb', 2, async () => videos)
    assert.deepEqual(related.map((v) => v.id), ['aaaaaaaaaaa', 'ccccccccccc'])
  })

  await test('queries the requested category', async () => {
    let requested: VideoCategory | undefined
    await loadRelatedVideos('Leadership', 'x', 5, async (category) => {
      requested = category
      return []
    })
    assert.equal(requested, 'Leadership')
  })

  await test('returns the public shape without transcripts', async () => {
    const [video] = await loadRelatedVideos('AI Works', 'other', 5, async () => [makeVideo('aaaaaaaaaaa')])
    assert.equal(video.en.title, 'Title aaaaaaaaaaa')
    assert.equal(video.thumbnailUrl, 'https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg')
    assert.ok(!JSON.stringify(video).includes('transcript'), 'transcripts must not reach the page')
  })

  await test('normalizes legacy videos without bilingual fields', async () => {
    const legacy = makeVideo('aaaaaaaaaaa', { en: undefined, vi: undefined, title: 'Legacy title' })
    const [video] = await loadRelatedVideos('AI Works', 'other', 5, async () => [legacy])
    assert.equal(video.en.title, 'Legacy title')
  })

  await test('loader failure hides the block instead of breaking the page', async () => {
    const originalError = console.error
    console.error = () => {}
    try {
      const related = await loadRelatedVideos('AI Works', 'x', 5, async () => {
        throw new Error('KV unavailable')
      })
      assert.deepEqual(related, [])
    } finally {
      console.error = originalError
    }
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
