/**
 * Read-only retrieval A/B against the configured index. Uses billable OpenAI
 * embeddings; --generate additionally runs answers. Never calls /api/chat or
 * writes KV/Pinecone. Output omits raw source content. Review answers manually.
 * npx tsx scripts/replay-chat-retrieval.ts /tmp/retrieval.json [--generate]
 */
import { config } from 'dotenv'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { getPineconeIndex } from '../lib/pinecone'
import { createEmbedding, getOpenAIClient } from '../lib/openai'
import { resolveVideoRetrievalScope, retrieveChatMatches, type RetrievalMatchLike } from '../lib/chatRetrieval'
import { buildContext } from '../lib/chatContext'
import { sanitizeChatHistory, validateChatMessage } from '../lib/inputValidator'

config({ path: '.env.local', quiet: true })

async function main() {
  const output = process.argv[2]
  if (!output || output.startsWith('--')) throw new Error('Supply output path')
  if (process.env.PINECONE_INDEX_NAME !== 'hungreo-website-v2') throw new Error('Expected audited index hungreo-website-v2')
  const generate = process.argv.includes('--generate')
  const selected = process.argv.find(arg => arg.startsWith('--cases='))?.slice('--cases='.length).split(',')
  const retrievalSha256 = createHash('sha256').update(fs.readFileSync('lib/chatRetrieval.ts')).digest('hex')
  const contextSha256 = createHash('sha256').update(fs.readFileSync('lib/chatContext.ts')).digest('hex')
  // Patch A ignored these two fields. Strip them only for the control so
  // changing the adapter cannot silently change both sides of the experiment.
  const controlContext = (matches: RetrievalMatchLike[]) => buildContext(matches.map(m => ({
    ...m, metadata: { ...m.metadata, content: undefined, fileName: undefined },
  })))
  const route = fs.readFileSync('app/api/chat/route.ts', 'utf8')
  const promptBody = route.split('const systemPrompt = `')[1]?.split('`\n')[0]
  if (!promptBody?.includes('${context}${contextInfo}')) throw new Error('Prompt extraction failed; review route before replay')
  const baseline = JSON.parse(fs.readFileSync('docs/CHATBOT_BASELINE_2026-09-08.json', 'utf8')).baseline
  const index = await getPineconeIndex()
  const rows: unknown[] = []
  for (const test of baseline) {
    if (selected && !selected.includes(test.id)) continue
    const payload = test.payload
    const query = validateChatMessage(payload.message).sanitized!
    const vector = await createEmbedding(query)
    const discovery = await index.query({ vector, topK: 20, includeMetadata: true })
    const cache = new Map<string, Promise<RetrievalMatchLike[]>>()
    const queryVideo = (videoId: string) => {
      if (!cache.has(videoId)) cache.set(videoId, index.query({ vector, topK: 5, includeMetadata: true, filter: { videoId: { $eq: videoId } } }).then(r => r.matches))
      return cache.get(videoId)!
    }
    // Control reproduces shipped Patch A retrieval. Same embedding, discovery,
    // scoped responses, context builder and complete system prompt for both.
    const options = { query, pageContextVideoId: payload.pageContext?.videoId, matches: discovery.matches }
    const scope = resolveVideoRetrievalScope(options)
    let before: RetrievalMatchLike[] = discovery.matches.slice(0, 5)
    if (scope) {
      const scoped = await queryVideo(scope.videoId)
      if (scoped.length) before = scoped
    }
    const after = await retrieveChatMatches({ ...options, discoveryMatches: discovery.matches, queryVideo })
    let contextInfo = ''
    if (payload.pageContext) {
      if (scope?.source === 'page-context') contextInfo = `\n\nThe user is currently viewing a YouTube video (ID: ${scope.videoId}). If they ask about "this video" or "the video", they're referring to this one.`
      else if (payload.pageContext.page) contextInfo = `\n\nThe user is currently on page: ${payload.pageContext.page}`
    }
    const summarize = (matches: RetrievalMatchLike[], contextBuilder: (matches: RetrievalMatchLike[]) => string = buildContext) => ({
      chunks: matches.map(m => ({ id: m.id, score: m.score, videoId: m.metadata?.videoId, type: m.metadata?.vectorType || m.metadata?.type, title: m.metadata?.title })),
      contextChars: contextBuilder(matches).length,
    })
    const row: Record<string, unknown> = { id: test.id, expected: test.expected, before: summarize(before, controlContext), after: summarize(after) }
    if (generate && ['single_vi', 'two_vi', 'three_en', 'document_video_vi', 'unknown_vi'].includes(test.id)) {
      const answer = async (matches: RetrievalMatchLike[], contextBuilder: (matches: RetrievalMatchLike[]) => string = buildContext) => {
        const prompt = promptBody.replace('${context}', () => contextBuilder(matches)).replace('${contextInfo}', () => contextInfo)
        const result = await getOpenAIClient().chat.completions.create({
          model: 'gpt-4.1-mini', temperature: 0.7, max_tokens: 2000,
          messages: [{ role: 'system', content: prompt }, ...sanitizeChatHistory(payload.history), { role: 'user', content: query }],
        })
        return { text: result.choices[0]?.message?.content, usage: result.usage }
      }
      row.answers = { before: await answer(before, controlContext), after: await answer(after) }
    }
    rows.push(row)
    console.log(JSON.stringify({ id: test.id, before: before.map(m => m.metadata?.videoId || m.metadata?.vectorType), after: after.map(m => m.metadata?.videoId || m.metadata?.vectorType) }))
    fs.writeFileSync(output, JSON.stringify({ at: new Date().toISOString(), retrievalSha256, contextSha256, index: process.env.PINECONE_INDEX_NAME, mode: 'outside-route replay, not production response', rows }, null, 2))
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Replay failed'); process.exitCode = 1 })
