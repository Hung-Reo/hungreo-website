import assert from 'node:assert/strict'

// Run against `next start`, including a Node runtime without require(ESM):
// node --no-experimental-require-module node_modules/next/dist/bin/next start -p 3100
// npm run test:ssr
// Reads published content only. Never target a remote deployment from this test.
const baseUrl = new URL(process.env.SSR_TEST_BASE_URL || 'http://127.0.0.1:3100')
assert.ok(
  baseUrl.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(baseUrl.hostname),
  'SSR_TEST_BASE_URL must point to a local HTTP server'
)

async function main() {
  let checked = 0
  const failures: string[] = []

  for (const [kind, listKey] of [['projects', 'projects'], ['blog', 'posts']]) {
    const response = await fetch(new URL(`/api/content/${kind}`, baseUrl), {
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    })
    assert.equal(response.status, 200, `${kind} catalog must load`)
    const data = await response.json()
    const published = data[listKey].filter((item: { status: string }) => item.status === 'published')
    assert.ok(published.length > 0, `${kind} needs published content; an empty catalog is not a passing test`)

    for (const item of published) {
      const path = `/${kind}/${encodeURIComponent(item.slug)}`
      // An independent second GET exercises direct reload as well as first load.
      for (let attempt = 1; attempt <= 2; attempt++) {
        const page = await fetch(new URL(path, baseUrl), {
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
        })
        const html = await page.text()
        if (page.status !== 200 || !html.includes('<title>') || html.includes('NEXT_HTTP_ERROR_FALLBACK;500')) {
          failures.push(`${path}, GET ${attempt}: HTTP ${page.status}`)
        }
      }
      checked++
      console.log(`Checked ${path}`)
    }
  }

  assert.deepEqual(failures, [], `SSR failures:\n${failures.join('\n')}`)
  console.log(`PASS ${checked} published detail pages: direct GET + reload`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'SSR check failed')
  process.exitCode = 1
})
