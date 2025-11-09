#!/usr/bin/env tsx

/**
 * Basic unit tests for text utility functions
 *
 * Run with: npx tsx __tests__/textUtils.test.ts
 */

import assert from 'assert'
import { chunkText } from '../lib/textUtils'

console.log('🧪 Running textUtils tests...\n')

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passed++
  } catch (error) {
    console.log(`❌ ${name}`)
    console.error(`   ${error instanceof Error ? error.message : error}`)
    failed++
  }
}

// Test 1: Basic chunking
test('should chunk text into smaller pieces', () => {
  const text = 'This is a test. '.repeat(100) // Create a long text
  const chunks = chunkText(text)

  assert.ok(Array.isArray(chunks), 'Should return an array')
  assert.ok(chunks.length > 0, 'Should have at least one chunk')
  chunks.forEach((chunk, i) => {
    assert.ok(typeof chunk === 'string', `Chunk ${i} should be a string`)
  })
})

// Test 2: Empty text handling
test('should handle empty text', () => {
  const chunks = chunkText('')
  assert.ok(Array.isArray(chunks), 'Should return an array for empty text')
})

// Test 3: Short text handling
test('should handle text shorter than chunk size', () => {
  const text = 'This is a short text.'
  const chunks = chunkText(text)

  assert.strictEqual(chunks.length, 1, 'Should return single chunk for short text')
  assert.strictEqual(chunks[0], text, 'Chunk should equal original text')
})

// Test 4: Chunk size validation
test('should respect maximum chunk size', () => {
  const text = 'word '.repeat(1000) // Create long text
  const chunks = chunkText(text)

  chunks.forEach((chunk, i) => {
    // Each chunk should be reasonable size (not too large)
    assert.ok(chunk.length < 3000, `Chunk ${i} should not exceed reasonable size`)
  })
})

// Test 5: No empty chunks
test('should not produce empty chunks', () => {
  const text = 'This is a test. '.repeat(100)
  const chunks = chunkText(text)

  chunks.forEach((chunk, i) => {
    assert.ok(chunk.trim().length > 0, `Chunk ${i} should not be empty`)
  })
})

// Test 6: Preserve content
test('should preserve all content across chunks', () => {
  const text = 'The quick brown fox jumps over the lazy dog. '.repeat(50)
  const chunks = chunkText(text)
  const rejoined = chunks.join(' ')

  // Check that no content is completely lost (allowing for some overlap/spacing differences)
  const originalWords = text.split(/\s+/).filter(Boolean).length
  const rejoinedWords = rejoined.split(/\s+/).filter(Boolean).length

  assert.ok(
    rejoinedWords >= originalWords * 0.9, // Allow up to 10% difference due to overlap
    'Should preserve most of the original content'
  )
})

// Test 7: Handle special characters
test('should handle special characters', () => {
  const text = 'Hello! How are you? I\'m fine. #hashtag @mention 100% sure.'
  const chunks = chunkText(text)

  assert.ok(chunks.length > 0, 'Should handle special characters')
  const combined = chunks.join(' ')
  assert.ok(combined.includes('Hello'), 'Should preserve content with special chars')
})

// Test 8: Handle newlines
test('should handle text with newlines', () => {
  const text = 'Line 1\nLine 2\nLine 3\n'.repeat(50)
  const chunks = chunkText(text)

  assert.ok(chunks.length > 0, 'Should handle newlines')
  chunks.forEach((chunk) => {
    assert.ok(typeof chunk === 'string', 'Chunks should be strings')
  })
})

// Summary
console.log(`\n${'='.repeat(40)}`)
console.log(`Total: ${passed + failed} tests`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`${'='.repeat(40)}`)

process.exit(failed > 0 ? 1 : 0)
