/**
 * Job ids for long admin operations (scrape, document upload/approval, video
 * embedding). The browser creates the id and opens the progress stream BEFORE
 * it sends the request, so the progress bar moves while the work runs instead
 * of appearing only after the response returns.
 *
 * No Node imports: shared by client components and API routes.
 */

const SAFE_SUFFIX = /^[A-Za-z0-9-]{8,80}$/

/** Client side: a fresh id such as `website-scrape-<uuid>`. */
export function newJobId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`
}

/**
 * Server side: use the id the client sent when it is well formed and carries
 * the expected prefix; otherwise fall back to a server-generated id so older
 * clients keep working.
 */
export function resolveJobId(requested: unknown, prefix: string): string {
  if (typeof requested === 'string' && requested.startsWith(`${prefix}-`)) {
    const suffix = requested.slice(prefix.length + 1)
    if (SAFE_SUFFIX.test(suffix)) return requested
  }
  return `${prefix}-${Date.now()}`
}
