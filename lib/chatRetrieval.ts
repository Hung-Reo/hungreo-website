export interface RetrievalMatchLike {
  id: string
  score?: number
  metadata?: Record<string, unknown>
}

export interface VideoRetrievalScope {
  videoId: string
  source: 'page-context' | 'title' | 'history'
}

interface ResolveVideoRetrievalScopeOptions {
  query: string
  pageContextVideoId?: unknown
  matches: ReadonlyArray<RetrievalMatchLike>
  /** Videos the assistant already cited, newest first. Lets a follow-up such as
   *  "hai nguồn vừa so sánh khác nhau ở đâu" find sources the new question
   *  never names — the previous answer named them for it. */
  historyVideoIds?: ReadonlyArray<string>
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

const YOUTUBE_URL_PATTERN =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g

/**
 * Pull video IDs out of what the assistant previously said, newest turn first.
 * Only assistant turns are read: those links were produced from context this
 * server chose, so they cannot be used to point retrieval at arbitrary IDs.
 */
export function extractVideoIdsFromHistory(
  history: ReadonlyArray<{ role?: unknown; content?: unknown }> | undefined
): string[] {
  if (!Array.isArray(history)) return []
  const ids: string[] = []
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i]
    if (turn?.role !== 'assistant' || typeof turn.content !== 'string') continue
    for (const match of turn.content.matchAll(YOUTUBE_URL_PATTERN)) {
      if (!ids.includes(match[1])) ids.push(match[1])
    }
  }
  return ids
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
  historyVideoIds,
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

  const titleScopes: VideoRetrievalScope[] = ranked
    .filter((candidate) => candidate.videoId !== contextVideoId)
    .map((candidate) => ({ videoId: candidate.videoId, source: 'title' as const }))

  const pageScopes: VideoRetrievalScope[] = contextVideoId
    ? [{ videoId: contextVideoId, source: 'page-context' as const }]
    : []

  // The page a visitor happens to be on is a default, not an override. When the
  // question names other videos, those come first and the page video keeps a
  // slot behind them; with nothing named it stays the primary scope.
  const ordered = titleScopes.length ? [...titleScopes, ...pageScopes] : [...pageScopes]

  const seen = new Set(ordered.map((scope) => scope.videoId))
  for (const videoId of historyVideoIds || []) {
    const valid = getValidVideoId(videoId)
    if (valid && !seen.has(valid)) {
      seen.add(valid)
      ordered.push({ videoId: valid, source: 'history' })
    }
  }

  // Bounded fan-out: no more than three optional Pinecone queries.
  return ordered.slice(0, 3)
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
  query, pageContextVideoId, discoveryMatches, queryVideo, onScopeError, historyVideoIds,
}: {
  query: string
  pageContextVideoId?: unknown
  discoveryMatches: ReadonlyArray<RetrievalMatchLike>
  queryVideo: (videoId: string) => Promise<ReadonlyArray<RetrievalMatchLike>>
  onScopeError?: () => void
  historyVideoIds?: ReadonlyArray<string>
}): Promise<RetrievalMatchLike[]> {
  const scopes = resolveVideoRetrievalScopes({
    query, pageContextVideoId, matches: discoveryMatches, historyVideoIds,
  })
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
