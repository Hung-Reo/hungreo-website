export interface RetrievalMatchLike {
  id: string
  score?: number
  metadata?: Record<string, unknown>
}

export interface VideoRetrievalScope {
  videoId: string
  source: 'page-context' | 'title'
}

interface ResolveVideoRetrievalScopeOptions {
  query: string
  pageContextVideoId?: unknown
  matches: ReadonlyArray<RetrievalMatchLike>
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

// Generic chat/video words are intentionally excluded so a request such as
// "lesson learn của video" cannot accidentally select an unrelated video.
const TITLE_STOP_WORDS = new Set([
  'about',
  'and',
  'anything',
  'ban',
  'cho',
  'chi',
  'cua',
  'detail',
  'details',
  'for',
  'from',
  'hello',
  'how',
  'learn',
  'learning',
  'lesson',
  'minh',
  'nhe',
  'noi',
  'the',
  'this',
  'tiet',
  'to',
  'video',
  'what',
  'with',
  'your',
])

function normalizeTokens(value: string): string[] {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .match(/[a-z0-9]+/g) || []
  )
}

function getDistinctiveTokens(value: string): string[] {
  return [
    ...new Set(
      normalizeTokens(value).filter(
        (token) => token.length >= 2 && !TITLE_STOP_WORDS.has(token)
      )
    ),
  ]
}

function getValidVideoId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : undefined
}

function isVideoMetadata(
  metadata: Record<string, unknown>
): boolean {
  return metadata.vectorType === 'video' || metadata.type === 'video'
}

/**
 * Resolve bounded video scopes without trusting raw user input.
 * A validated page context comes first; title scopes are selected only when the
 * query overlaps at least two distinctive title tokens with sufficient signal.
 */
export function resolveVideoRetrievalScopes({
  query,
  pageContextVideoId,
  matches,
}: ResolveVideoRetrievalScopeOptions): VideoRetrievalScope[] {
  const contextVideoId = getValidVideoId(pageContextVideoId)

  const queryTokens = new Set(getDistinctiveTokens(query))
  const candidates = new Map<
    string,
    { videoId: string; matchingTokens: number; coverage: number; score: number }
  >()

  for (const match of matches) {
    const metadata = match.metadata
    if (!metadata || !isVideoMetadata(metadata)) continue

    const videoId = getValidVideoId(metadata.videoId)
    const title = typeof metadata.title === 'string' ? metadata.title : ''
    if (!videoId || !title) continue

    const titleTokens = getDistinctiveTokens(title)
    if (titleTokens.length < 2) continue

    const matchingTokens = titleTokens.filter((token) =>
      queryTokens.has(token)
    ).length
    const coverage = matchingTokens / titleTokens.length

    // Two matches are enough for concise titles; longer titles require either
    // stronger coverage or at least three matching tokens.
    if (matchingTokens < 2 || (coverage < 0.4 && matchingTokens < 3)) continue

    const candidate = {
      videoId,
      matchingTokens,
      coverage,
      score: match.score || 0,
    }
    const existing = candidates.get(videoId)

    if (
      !existing ||
      candidate.matchingTokens > existing.matchingTokens ||
      (candidate.matchingTokens === existing.matchingTokens &&
        candidate.coverage > existing.coverage) ||
      (candidate.matchingTokens === existing.matchingTokens &&
        candidate.coverage === existing.coverage &&
        candidate.score > existing.score)
    ) {
      candidates.set(videoId, candidate)
    }
  }

  const ranked = [...candidates.values()].sort(
    (a, b) =>
      b.matchingTokens - a.matchingTokens ||
      b.coverage - a.coverage ||
      b.score - a.score
  )

  const scopes: VideoRetrievalScope[] = contextVideoId
    ? [{ videoId: contextVideoId, source: 'page-context' }] : []
  for (const candidate of ranked) {
    if (candidate.videoId !== contextVideoId) scopes.push({ videoId: candidate.videoId, source: 'title' })
  }
  // Bounded fan-out: no more than three optional Pinecone queries.
  return scopes.slice(0, 3)
}

/** Compatibility helper for page-context attribution and existing callers. */
export function resolveVideoRetrievalScope(options: ResolveVideoRetrievalScopeOptions): VideoRetrievalScope | undefined {
  return resolveVideoRetrievalScopes(options)[0]
}

/**
 * Keep scoped depth AND global evidence. Round-robin gives each available
 * scope and the global pool a slot before taking another chunk from either.
 * Discovery/global limits remain unchanged; only scoped contexts grow to 8.
 */
export async function retrieveChatMatches({
  query, pageContextVideoId, discoveryMatches, queryVideo, onScopeError,
}: {
  query: string
  pageContextVideoId?: unknown
  discoveryMatches: ReadonlyArray<RetrievalMatchLike>
  queryVideo: (videoId: string) => Promise<ReadonlyArray<RetrievalMatchLike>>
  onScopeError?: () => void
}): Promise<RetrievalMatchLike[]> {
  const scopes = resolveVideoRetrievalScopes({ query, pageContextVideoId, matches: discoveryMatches })
  const global = discoveryMatches.slice(0, 5)
  if (!scopes.length) return global

  const responses = await Promise.all(scopes.map(async scope => {
    try {
      const matches = await queryVideo(scope.videoId)
      return matches.filter(match => match.metadata?.videoId === scope.videoId).slice(0, 5)
    } catch {
      onScopeError?.()
      return []
    }
  }))
  const pools = responses.filter(matches => matches.length > 0)
  if (!pools.length) return global
  if (pools.length === 1) {
    // Preserve all five chunks for a single-video question as before, then
    // add global evidence without duplicating the scoped chunks.
    return [...new Map([...pools[0], ...global].map(match => [match.id, match])).values()].slice(0, 8)
  }
  pools.push(global)

  const result: RetrievalMatchLike[] = []
  const seen = new Set<string>()
  while (result.length < 8) {
    let added = false
    for (const pool of pools) {
      let next = pool.shift()
      while (next && seen.has(next.id)) next = pool.shift()
      if (!next) continue
      seen.add(next.id)
      result.push(next)
      added = true
      if (result.length === 8) break
    }
    if (!added) break
  }
  return result
}
