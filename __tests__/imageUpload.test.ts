#!/usr/bin/env tsx

import assert from 'assert'
import { readFileSync } from 'fs'
import { join } from 'path'
import { validateUpload } from '../lib/uploadValidator'
import { getUploadErrorMessage, asUploadFile } from '../lib/uploadClient'

console.log('Running image upload tests...\n')

let passed = 0
let failed = 0
const pending: Promise<void>[] = []

function test(name: string, fn: () => void | Promise<void>) {
  const run = async () => {
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
  pending.push(run())
}

function image(name: string, type: string, size = 1000) {
  return new File([new Uint8Array(size)], name, { type })
}

test('validator: accepts jpg/png/webp (case-insensitive extension)', () => {
  assert.equal(validateUpload(image('a.JPG', 'image/jpeg'), 'image').valid, true)
  assert.equal(validateUpload(image('b.png', 'image/png'), 'image').valid, true)
  assert.equal(validateUpload(image('c.webp', 'image/webp'), 'image').valid, true)
})

test('validator: rejects iPhone HEIC/HEIF with an actionable message', () => {
  for (const [name, type] of [['IMG_0001.HEIC', 'image/heic'], ['photo.heif', 'image/heif'], ['x.heic', '']]) {
    const result = validateUpload(image(name, type), 'image')
    assert.equal(result.valid, false, name)
    assert.match(result.error || '', /HEIC/, name)
    assert.match(result.error || '', /JPEG|JPG/, name)
  }
})

test('validator: rejects files over 5MB', () => {
  const result = validateUpload(image('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1), 'image')
  assert.equal(result.valid, false)
  assert.match(result.error || '', /5MB/)
})

test('error message: uses the server JSON error', async () => {
  const response = new Response(JSON.stringify({ error: 'File type not allowed' }), { status: 400 })
  assert.equal(await getUploadErrorMessage(response), 'File type not allowed (HTTP 400)')
})

test('error message: falls back to HTTP status when the body is not JSON', async () => {
  const response = new Response('<html>Request Entity Too Large</html>', { status: 413 })
  assert.equal(await getUploadErrorMessage(response), 'Upload failed (HTTP 413)')
})

test('root cause: a Blob with a .name property is sent as "blob" in FormData', () => {
  // browser-image-compression 2.x returns a Blob and only sets blob.name
  const compressed = Object.assign(new Blob([new Uint8Array(10)], { type: 'image/png' }), { name: 'cover.png' })
  const formData = new FormData()
  formData.append('image', compressed)
  assert.equal((formData.get('image') as File).name, 'blob')
})

test('asUploadFile keeps the original name and the compressed type', () => {
  const compressed = new Blob([new Uint8Array(10)], { type: 'image/jpeg' })
  const file = asUploadFile(compressed, 'IMG 01.JPG')
  const formData = new FormData()
  formData.append('image', file)
  const sent = formData.get('image') as File
  assert.equal(sent.name, 'IMG 01.JPG')
  assert.equal(sent.type, 'image/jpeg')
  assert.equal(validateUpload(sent, 'image').valid, true)
})

test('ImageUploader validates before upload and shows the server error', () => {
  const source = readFileSync(join(process.cwd(), 'components/admin/ImageUploader.tsx'), 'utf8')
  for (const needle of ["validateUpload(file, 'image')", 'getUploadErrorMessage', 'accept="image/jpeg,image/png', 'asUploadFile(']) {
    assert.ok(source.includes(needle), `ImageUploader must use ${needle}`)
  }
  assert.ok(!source.includes("toast.error('Upload failed')"), 'generic error toast must be gone')
})

Promise.all(pending).then(() => {
  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
})
