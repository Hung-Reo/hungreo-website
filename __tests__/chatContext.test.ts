#!/usr/bin/env tsx

import assert from 'assert'
import { buildContext, describeSource, websiteUrlFromPage } from '../lib/chatContext'

console.log('Running chat context tests...\n')

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

// Shapes copied from a read-only probe of the production index on 2026-09-08.
const selfStudyVideo = {
  title: 'How to Teach Yourself Anything (The Self-Study Blueprint)',
  channelTitle: 'The Mindset Mentor Podcast',
  description: 'Three habits that make self-teaching stick.',
  type: 'video',
  vectorType: 'video',
  videoId: 'O8_isifBeKk',
}

const legacyVideo = {
  title: 'Vibe Coding Fundamentals In 33 minutes',
  description: 'Fundamentals walkthrough.',
  url: 'https://youtube.com/watch?v=iLCDSY2XX7E',
  type: 'video',
  vectorType: 'video',
  videoId: 'iLCDSY2XX7E',
}

const aboutPage = {
  title: 'About Me | Hung Dinh',
  description: '20 years as a Business Analyst.',
  page: '/about',
  type: 'website',
  vectorType: 'website',
  lastScraped: '1780308454897',
}

const uploadedDocument = {
  title: 'Van_Hoa_Gia_Dinh_RAG.docx',
  description: 'Family culture notes.',
  documentId: 'doc_1764226748060_ssobx09lf',
  type: 'document',
  vectorType: 'document',
}

test('keeps the publishing channel so a video is not credited to Hung', () => {
  const source = describeSource(selfStudyVideo, 1)
  assert.equal(source.attribution, 'The Mindset Mentor Podcast')
  assert.notEqual(source.attribution, 'Hung Dinh')
})

test('gives a video a verifiable YouTube URL', () => {
  assert.equal(
    describeSource(selfStudyVideo, 1).url,
    'https://www.youtube.com/watch?v=O8_isifBeKk'
  )
})

test('states no attribution rather than guessing one for legacy video vectors', () => {
  const source = describeSource(legacyVideo, 1)
  assert.equal(source.attribution, undefined)
  assert.equal(source.url, 'https://www.youtube.com/watch?v=iLCDSY2XX7E')
})

test('turns a website page path into an absolute URL', () => {
  assert.equal(describeSource(aboutPage, 1).url, 'https://hungreo.com/about')
  assert.equal(websiteUrlFromPage('/'), 'https://hungreo.com')
})

test('attributes website chunks to Hung', () => {
  assert.match(describeSource(aboutPage, 1).attribution || '', /Hung Dinh/)
})

test('exposes an uploaded document by reference, never by URL', () => {
  const source = describeSource(uploadedDocument, 1)
  assert.equal(source.reference, 'doc_1764226748060_ssobx09lf')
  assert.equal(source.url, undefined)
})

test('degrades safely when metadata is missing', () => {
  const source = describeSource({}, 3)
  assert.equal(source.label, 'Source 3')
  assert.equal(source.title, 'Untitled')
  assert.equal(source.type, 'unknown')
  assert.equal(source.content, 'No description')
})

test('renders labelled blocks carrying channel and URL', () => {
  const context = buildContext([{ metadata: selfStudyVideo }, { metadata: aboutPage }])
  assert.ok(context.includes('Source 1:'), 'first source is labelled')
  assert.ok(context.includes('Source 2:'), 'second source is labelled')
  assert.ok(
    context.includes('Author/Channel: The Mindset Mentor Podcast'),
    'channel reaches the prompt'
  )
  assert.ok(
    context.includes('URL: https://www.youtube.com/watch?v=O8_isifBeKk'),
    'video URL reaches the prompt'
  )
  assert.ok(context.includes('URL: https://hungreo.com/about'), 'website URL reaches the prompt')
})

test('marks a private document as not publicly accessible', () => {
  const context = buildContext([{ metadata: uploadedDocument }])
  assert.ok(context.includes('Reference: doc_1764226748060_ssobx09lf (not publicly accessible)'))
  assert.ok(!context.includes('URL:'), 'no link is offered for a private file')
})

test('video uses actual transcript rather than repeated promotional description', () => {
  const transcript = 'The implementation requires clear requirements and a testable outcome.'
  const source = describeSource({ ...legacyVideo, description: 'Subscribe and join the bootcamp', content: transcript }, 1)
  assert.equal(source.content, transcript)
})

test('document uses full chunk including evidence beyond the preview', () => {
  const full = 'a'.repeat(500) + ' The decisive evidence occurs after the preview.'
  assert.equal(describeSource({ ...uploadedDocument, description: full.slice(0, 500), content: full }, 1).content, full)
})

test('approve-route metadata works without backfilling title or description', () => {
  const source = describeSource({ type: 'document', vectorType: 'document', fileName: 'Family notes.docx', content: 'Full approved content', documentId: 'doc-approved' }, 1)
  assert.equal(source.title, 'Family notes.docx')
  assert.equal(source.content, 'Full approved content')
  assert.equal(source.url, undefined)
})

test('empty or malformed full content retains legacy preview', () => {
  for (const content of ['', '   ', {}, 123]) {
    assert.equal(describeSource({ ...legacyVideo, content }, 1).content, legacyVideo.description)
  }
})

console.log(`\nTotal: ${passed + failed}`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)
process.exit(failed > 0 ? 1 : 0)
