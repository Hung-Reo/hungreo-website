#!/usr/bin/env tsx

// Research cards come from the private super-app repo. This repo is public, so the
// fixtures below are invented cards that only copy the STRUCTURE of a real card.

import assert from 'assert'
import { parseCard, isCardFileName } from '../lib/research/card'
import { parseQuestions } from '../lib/research/questions'

console.log('Running research card tests...\n')

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

const FORMAT_2 = `---
id: EDU-2099-W01
version: 2
format: 2
status: draft
question: "Câu hỏi giả để test?"
checked: 2099-01-05
researcher: "test"
model: test-model
---

# EDU-2099-W01 · Tiêu đề giả

## Câu hỏi
Đoạn mở đầu giả.

## 3 ý chính
- **fact:** Ý một có nguồn [1] · độ chắc: cao — văn bản chính thức
  - Nguồn nói: Nguồn giả nói điều A.
  - Ví dụ (mình dựng): Một ví dụ dựng.
  - Vì sao quan trọng: Lý do giả.

- **fact:** Ý hai [2] · độ chắc: rất thấp — một nghiên cứu nhỏ
  - Nguồn nói: Nguồn giả nói điều B.
  - Ví dụ (mình dựng): Ví dụ B.
  - Vì sao quan trọng: Lý do B.

- **inference:** Ghép hai ý.

## Giới hạn
- Giới hạn giả.

## Một cách thử
- **idea:** Trò chơi giả 10 phút.

## Nguồn
1. [Nguồn A — có gạch ngang trong tên](https://example.org/a) — kiểm 2099-01-05 — đọc: phần liên quan (mục 1) — đối tượng: trẻ giả 5 tuổi
2. [Nguồn B](https://example.org/b) và [bản phụ](https://example.org/b2) — kiểm 2099-01-04 — đọc: abstract — đối tượng: người lớn giả
3. dòng nguồn không đúng khuôn

## Hưng nhìn lại
*Phần này để Hưng tự viết.*
- Mình hiểu thêm điều gì:
`

const FORMAT_1 = `---
id: EDU-2099-W02
version: 1
status: draft
question: "Câu hỏi format 1?"
checked: 2099-01-12
researcher: "test"
model: test-model
---

# EDU-2099-W02 · Phiếu format 1

## 3 ý chính
- **fact:** Một câu sự thật [1].
- **inference:** Một câu suy luận.

## Nguồn
1. [Nguồn C](https://example.org/c) — kiểm 2099-01-12 — đọc: toàn văn — đối tượng: trẻ giả
`

test('parses frontmatter and title', () => {
  const card = parseCard(FORMAT_2)
  assert.strictEqual(card.meta.id, 'EDU-2099-W01')
  assert.strictEqual(card.meta.version, 2)
  assert.strictEqual(card.meta.format, 2)
  assert.strictEqual(card.meta.question, 'Câu hỏi giả để test?')
  assert.strictEqual(card.meta.checked, '2099-01-05')
  assert.strictEqual(card.title, 'EDU-2099-W01 · Tiêu đề giả')
  assert.match(card.sha256, /^[0-9a-f]{64}$/)
})

test('splits main ideas with certainty and the three parts', () => {
  const card = parseCard(FORMAT_2)
  const main = card.sections.find((s) => s.title === '3 ý chính')
  assert.ok(main && main.kind === 'ideas')
  const ideas = main.ideas
  assert.strictEqual(ideas.length, 3)
  assert.strictEqual(ideas[0].label, 'fact')
  assert.strictEqual(ideas[0].text, 'Ý một có nguồn [1]')
  assert.strictEqual(ideas[0].certainty, 'cao')
  assert.strictEqual(ideas[0].certaintyReason, 'văn bản chính thức')
  assert.strictEqual(ideas[0].parts.sourceSays, 'Nguồn giả nói điều A.')
  assert.strictEqual(ideas[0].parts.example, 'Một ví dụ dựng.')
  assert.strictEqual(ideas[0].parts.whyItMatters, 'Lý do giả.')
  assert.strictEqual(ideas[1].certainty, 'rất thấp')
  assert.strictEqual(ideas[2].label, 'inference')
  assert.strictEqual(ideas[2].certainty, undefined)
})

test('idea section is parsed too', () => {
  const card = parseCard(FORMAT_2)
  const tryIt = card.sections.find((s) => s.title === 'Một cách thử')
  assert.ok(tryIt && tryIt.kind === 'ideas')
  assert.strictEqual(tryIt.ideas[0].label, 'idea')
})

test('parses sources and keeps unparseable lines as raw', () => {
  const card = parseCard(FORMAT_2)
  assert.strictEqual(card.sources.length, 3)
  const [a, b, c] = card.sources
  assert.strictEqual(a.n, 1)
  assert.strictEqual(a.url, 'https://example.org/a')
  assert.strictEqual(a.title, 'Nguồn A — có gạch ngang trong tên')
  assert.strictEqual(a.checked, '2099-01-05')
  assert.strictEqual(a.readingLevel, 'phần liên quan')
  assert.strictEqual(a.readingDetail, '(mục 1)')
  assert.strictEqual(a.population, 'trẻ giả 5 tuổi')
  assert.strictEqual(b.readingLevel, 'abstract')
  assert.ok(b.headMarkdown.includes('bản phụ'))
  assert.strictEqual(c.parsed, false)
  assert.strictEqual(c.raw, 'dòng nguồn không đúng khuôn')
})

test('format 1 card: ideas without parts or certainty', () => {
  const card = parseCard(FORMAT_1)
  assert.strictEqual(card.meta.format, 1)
  const main = card.sections.find((s) => s.title === '3 ý chính')
  assert.ok(main && main.kind === 'ideas')
  assert.strictEqual(main.ideas.length, 2)
  assert.strictEqual(main.ideas[0].parts.sourceSays, undefined)
})

test('broken card never loses text', () => {
  const raw = 'no frontmatter here\n\n## 3 ý chính\nrandom text **fact:** missing dash\n'
  const card = parseCard(raw)
  assert.strictEqual(card.meta.id, undefined)
  const main = card.sections.find((s) => s.title === '3 ý chính')
  assert.ok(main)
  assert.strictEqual(main.kind, 'markdown')
  assert.ok(main.markdown.includes('random text'))
})

test('stray lines inside an ideas section are kept as markdown', () => {
  const raw = FORMAT_2.replace('- **inference:** Ghép hai ý.', 'Một dòng lạ.\n- **inference:** Ghép hai ý.')
  const main = parseCard(raw).sections.find((s) => s.title === '3 ý chính')
  assert.ok(main && main.kind === 'ideas')
  assert.ok(main.extra.includes('Một dòng lạ.'))
})

test('isCardFileName accepts only card names', () => {
  assert.ok(isCardFileName('EDU-2026-W44b_v1'))
  assert.ok(isCardFileName('EDU-2026-W43_v12'))
  for (const bad of ['../EDU-2026-W43_v1', 'EDU-2026-W43_v1.md', 'QUESTIONS', 'EDU-2026-W4_v1', 'EDU-2026-W43_v1/x', '']) {
    assert.ok(!isCardFileName(bad), bad)
  }
})

const QUESTIONS = `# Hàng đợi

| # | Câu hỏi | Ai đề xuất, ngày | Trạng thái | Phiếu |
|---|---|---|---|---|
| W1 | Câu giả 1 | test | \`approved\` — đã duyệt | [EDU-2099-W01_v2](EDU-2099-W01_v2.md) |
| W2 | Câu giả 2 | test | \`draft\` — chờ | [EDU-2099-W02_v1](EDU-2099-W02_v1.md) |
| W3 | Câu giả 3 | test | chờ | — |
| W4 | Câu giả 4 | test | \`approvedish\` | [EDU-2099-W04_v1](EDU-2099-W04_v1.md) |
| W5 | Câu giả 5 | test | không có backtick | [EDU-2099-W05_v1](EDU-2099-W05_v1.md) |
`

test('questions: status from first backtick token, by column name', () => {
  const q = parseQuestions(QUESTIONS)
  assert.strictEqual(q.get('EDU-2099-W01_v2')?.status, 'approved')
  assert.strictEqual(q.get('EDU-2099-W02_v1')?.status, 'draft')
  assert.strictEqual(q.get('EDU-2099-W04_v1')?.status, 'unknown')
  assert.strictEqual(q.get('EDU-2099-W05_v1')?.status, 'unknown')
  assert.strictEqual(q.size, 4)
})

test('questions: topics column read by name, columns may move', () => {
  const withTopics = `| Phiếu | Chủ đề | Trạng thái |
|---|---|---|
| [x](EDU-2099-W01_v2.md) | lớp 1, tự lập; ngôn ngữ | \`approved\` |
| [y](EDU-2099-W02_v1.md) | — | \`dropped\` |
`
  const q = parseQuestions(withTopics)
  assert.deepStrictEqual(q.get('EDU-2099-W01_v2')?.topics, ['lớp 1', 'tự lập', 'ngôn ngữ'])
  assert.deepStrictEqual(q.get('EDU-2099-W02_v1')?.topics, [])
  assert.strictEqual(q.get('EDU-2099-W02_v1')?.status, 'dropped')
  assert.deepStrictEqual(parseQuestions(QUESTIONS).get('EDU-2099-W01_v2')?.topics, [])
})

test('questions: same card listed twice with different status is unknown', () => {
  const dup = QUESTIONS + `| W9 | lặp | test | \`draft\` | [EDU-2099-W01_v2](EDU-2099-W01_v2.md) |\n`
  assert.strictEqual(parseQuestions(dup).get('EDU-2099-W01_v2')?.status, 'unknown')
})

test('questions: no table means empty map', () => {
  assert.strictEqual(parseQuestions('# nothing\n').size, 0)
  assert.strictEqual(parseQuestions('').size, 0)
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
