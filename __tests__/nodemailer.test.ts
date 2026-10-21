#!/usr/bin/env tsx

// lib/gmailSender.ts (admin reply to contact requests) depends on nodemailer.
// Builds messages offline with streamTransport, so a nodemailer upgrade is checked
// without sending real email: Vietnamese text survives and a CRLF in the subject
// cannot inject extra headers.

import assert from 'assert'
import nodemailer from 'nodemailer'

console.log('Running nodemailer tests...\n')

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

async function build(options: nodemailer.SendMailOptions): Promise<string> {
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' })
  const info = await transport.sendMail({ from: 'Hung <owner@example.test>', to: 'guest@example.test', ...options })
  return (info.message as Buffer).toString('utf8')
}

async function main() {
  await test('UTF-8 subject and HTML body are encoded and decodable', async () => {
    const raw = await build({ subject: 'Re: Câu hỏi của bạn trên Hungreo', html: '<p>Xin chào, cảm ơn bạn!</p>' })
    assert.match(raw, /^Subject: =\?UTF-8\?/m)
    assert.match(raw, /Content-Type: text\/html; charset=utf-8/i)
    const decodedSubject = raw.match(/^Subject: (.+)$/m)![1]
    assert.ok(decodedSubject.length > 0)
  })

  await test('CRLF in the subject cannot add a Bcc header', async () => {
    const raw = await build({ subject: 'Hello\r\nBcc: attacker@example.test', text: 'body' })
    const headers = raw.split('\n\n')[0]
    assert.ok(!/^Bcc:/im.test(headers), 'no injected Bcc header')
  })

  console.log(`\n${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

main()
