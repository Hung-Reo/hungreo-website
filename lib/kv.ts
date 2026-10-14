import { createClient, type VercelKV } from '@vercel/kv'

/**
 * Shared KV client. Import `kv` from here, not from '@vercel/kv'.
 *
 * The stock `kv` export fetches with cache: 'default'. In Next 14 that puts
 * every KV read made outside cookies()/headers() into the Data Cache with no
 * expiry, so public pages and APIs (video detail, /api/videos, visitor count,
 * /api/cv, blog/project metadata, sitemap) kept serving the first value they
 * read. 'no-store' makes every call reach Redis, which is what a database
 * client should do; pages that want caching opt in with `revalidate`.
 *
 * Created lazily, like the stock export, so importing this module (e.g. during
 * `next build` without KV credentials) does not throw.
 */
let client: VercelKV | undefined

function getClient(): VercelKV {
  if (!client) {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    if (!url || !token) {
      throw new Error(
        '@vercel/kv: Missing required environment variables KV_REST_API_URL and KV_REST_API_TOKEN'
      )
    }
    client = createClient({ url, token, cache: 'no-store' })
  }
  return client
}

export const kv = new Proxy({} as VercelKV, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop)
  },
})
