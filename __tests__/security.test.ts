#!/usr/bin/env tsx

import assert from 'assert'
import {
  serializePublicBlogPost,
  serializePublicProject,
  type BlogPost,
  type Project,
} from '../lib/contentManager'
import { convertChatLogsToCSV, escapeCsvCell } from '../lib/chatLogExport'
import { serializeJsonLd } from '../lib/metadata'

console.log('Running security regression tests...\n')

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

const project: Project = {
  id: 'project-1',
  slug: 'safe-project',
  status: 'published',
  featured: true,
  createdAt: 1700000000000,
  updatedAt: 1700000000001,
  publishedAt: 1700000000002,
  createdBy: 'admin@example.com',
  en: {
    title: 'Safe Project',
    description: 'Public description',
    content: 'Public content',
  },
  vi: {
    title: 'Du an an toan',
    description: 'Mo ta public',
    content: 'Noi dung public',
  },
  techStack: ['Next.js'],
  learnings: ['Keep public responses shaped'],
  githubUrl: 'https://github.com/example/project',
  demoUrl: 'https://example.com',
  featuredImage: 'https://example.com/image.png',
  screenshots: ['https://example.com/screenshot.png'],
  source: {
    type: 'upload',
    rawContent: 'Internal source text',
    fileName: 'internal.pdf',
  },
}

const blogPost: BlogPost = {
  id: 'blog-1',
  slug: 'safe-blog',
  status: 'published',
  featured: false,
  createdAt: 1700000000000,
  updatedAt: 1700000000001,
  publishedAt: 1700000000002,
  createdBy: 'admin@example.com',
  en: {
    title: 'Safe Blog',
    excerpt: 'Public excerpt',
    content: 'Public content',
  },
  vi: {
    title: 'Bai viet an toan',
    excerpt: 'Mo ta public',
    content: 'Noi dung public',
  },
  category: 'Security',
  tags: ['security'],
  featuredImage: 'https://example.com/blog.png',
  readTime: 3,
  source: {
    rawDraft: 'Internal draft text',
    detectedLanguage: 'en',
  },
}

test('public project serializer removes internal fields', () => {
  const publicProject = serializePublicProject(project) as Record<string, unknown>

  assert.strictEqual('createdBy' in publicProject, false)
  assert.strictEqual('source' in publicProject, false)
  assert.strictEqual(publicProject.slug, 'safe-project')
  assert.deepStrictEqual(publicProject.techStack, ['Next.js'])
})

test('public blog serializer removes internal fields', () => {
  const publicPost = serializePublicBlogPost(blogPost) as Record<string, unknown>

  assert.strictEqual('createdBy' in publicPost, false)
  assert.strictEqual('source' in publicPost, false)
  assert.strictEqual(JSON.stringify(publicPost).includes('rawDraft'), false)
  assert.strictEqual(JSON.stringify(publicPost).includes('detectedLanguage'), false)
  assert.strictEqual(publicPost.slug, 'safe-blog')
})

test('JSON-LD serialization escapes script breakouts', () => {
  const serialized = serializeJsonLd({
    headline: '</script><script>alert(1)</script>',
  })

  assert.strictEqual(serialized.includes('</script>'), false)
  assert.ok(serialized.includes('\\u003c/script\\u003e'))
})

test('CSV cells neutralize spreadsheet formulas', () => {
  assert.strictEqual(escapeCsvCell('=HYPERLINK("https://example.com","x")'), `"'=HYPERLINK(""https://example.com"",""x"")"`)
  assert.strictEqual(escapeCsvCell('+1'), "'+1")
  assert.strictEqual(escapeCsvCell('-1'), "'-1")
  assert.strictEqual(escapeCsvCell('@cmd'), "'@cmd")
  assert.strictEqual(escapeCsvCell('\t=cmd'), "'\t=cmd")
})

test('CSV export preserves quoting while neutralizing untrusted chat text', () => {
  const csv = convertChatLogsToCSV([
    {
      id: 'chat-1',
      timestamp: 1700000000000,
      userMessage: '=HYPERLINK("https://example.com","x")',
      assistantResponse: 'Hello, "world"',
      pageContext: {
        page: '@admin',
        videoId: '+video',
      },
      relevantDocs: 0,
      responseTime: 10,
      needsHumanReply: false,
    },
  ])

  assert.strictEqual(csv.includes(',=HYPERLINK'), false)
  assert.ok(csv.includes(`"'=HYPERLINK(""https://example.com"",""x"")"`))
  assert.ok(csv.includes(`"Hello, ""world"""`))
  assert.ok(csv.includes("'@admin"))
  assert.ok(csv.includes("'+video"))
})

console.log(`\nTotal: ${passed + failed}`)
console.log(`Passed: ${passed}`)
console.log(`Failed: ${failed}`)

process.exit(failed > 0 ? 1 : 0)
