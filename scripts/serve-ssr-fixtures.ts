/**
 * Local-only, read-only KV fixture for production-render checks.
 * Snapshots public CMS DTOs; never loads credentials or writes to the real KV.
 * Usage: npx tsx scripts/serve-ssr-fixtures.ts [--xss]
 */
import { createServer } from 'node:http'

const attack = `<section data-ssr-sanitizer="safe"><strong>Sanitizer EN/VI check</strong><a href="https://example.com/">safe link</a><script>document.documentElement.setAttribute('data-ssr-xss','executed')</script><img src="/missing-xss-fixture.png" onerror="document.documentElement.setAttribute('data-ssr-xss','executed')"><a href="javascript:document.documentElement.setAttribute('data-ssr-xss','executed')">unsafe link</a><svg onload="document.documentElement.setAttribute('data-ssr-xss','executed')"></svg></section>`

async function main() {
  const records = new Map<string, unknown>()
  for (const [kind, listKey, prefix] of [
    ['projects', 'projects', 'project'],
    ['blog', 'posts', 'blog'],
  ]) {
    const response = await fetch(`https://hungreo.com/api/content/${kind}`, {
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) throw new Error(`Public ${kind} snapshot: HTTP ${response.status}`)
    const data = await response.json()
    if (!Array.isArray(data[listKey]) || !data[listKey].length) {
      throw new Error(`Public ${kind} snapshot is empty`)
    }
    for (const item of data[listKey]) {
      if (process.argv.includes('--xss')) {
        for (const lang of ['en', 'vi']) {
          item[lang].content = (item[lang].content || '') + '\n' + attack
        }
      }
      records.set(`${prefix}:${item.id}`, item)
      records.set(`${prefix}:slug:${item.slug}`, item.id)
    }
  }

  function command([operation, ...keys]: string[]) {
    const read = (key: string) => records.has(key) ? JSON.stringify(records.get(key)) : null
    switch (operation.toLowerCase()) {
      case 'get': return { result: read(keys[0]) }
      case 'mget': return { result: keys.map(read) }
      case 'keys': return {
        result: [...records.keys()].filter(key => keys[0].endsWith('*')
          ? key.startsWith(keys[0].slice(0, -1)) : key === keys[0]),
      }
      default: return { error: 'Fixture KV permits reads only' }
    }
  }

  createServer(async (request, response) => {
    if (request.method !== 'POST') { response.writeHead(405).end(); return }
    try {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const data = JSON.parse(Buffer.concat(chunks).toString())
      const result = Array.isArray(data[0]) ? data.map(command) : command(data)
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify(result))
    } catch {
      response.writeHead(400).end('Invalid fixture command')
    }
  }).listen(3102, '127.0.0.1', () => {
    console.log(`Read-only fixture KV: http://127.0.0.1:3102 (${process.argv.includes('--xss') ? 'XSS fixture' : 'public snapshot'})`)
  })
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Fixture server failed')
  process.exitCode = 1
})
