/**
 * Blog Translator
 * Translates one language tab of a blog post (title, excerpt, Markdown content)
 * into the other. The admin reviews the result before saving — nothing is persisted here.
 */

import type OpenAI from 'openai'
import { getOpenAIClient } from './openai'
import { AI_MODEL, reasoningParams } from './aiModel'

// Output budget includes reasoning tokens, content cap still guards against truncation.
export const MAX_TRANSLATE_CONTENT = 30_000
const MAX_OUTPUT_TOKENS = 32_000

type Lang = 'en' | 'vi'

const LANGUAGE_NAMES: Record<Lang, string> = { en: 'English', vi: 'Vietnamese' }

export interface TranslateInput {
  from: Lang
  to: Lang
  title: string
  excerpt: string
  content: string
}

export interface TranslateResult {
  title: string
  excerpt: string
  content: string
  warnings: string[]
}

function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'vi'
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function parseTranslateRequest(
  body: any
): { ok: true; input: TranslateInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid JSON body' }
  const { from, to } = body
  if (!isLang(from) || !isLang(to) || from === to) {
    return { ok: false, error: 'from/to must be "en" and "vi" (different)' }
  }

  const input: TranslateInput = {
    from,
    to,
    title: str(body.title).trim(),
    excerpt: str(body.excerpt).trim(),
    content: str(body.content),
  }

  if (!input.title && !input.excerpt && !input.content.trim()) {
    return { ok: false, error: 'Nothing to translate: title, excerpt and content are empty' }
  }
  if (input.content.length > MAX_TRANSLATE_CONTENT) {
    return { ok: false, error: 'Content too long to translate in one go (max 30,000 characters) — translate it in parts' }
  }

  return { ok: true, input }
}

function buildMessages(input: TranslateInput) {
  const source = LANGUAGE_NAMES[input.from]
  const target = LANGUAGE_NAMES[input.to]

  const system = `You are a professional ${source}-to-${target} translator for a personal blog.
Rules:
1. Translate faithfully. Keep the author's voice and meaning; do not summarize, add, or remove ideas.
2. Keep the Markdown structure exactly: same headings (#, ##, ###), lists, blockquotes, bold/italic, line breaks.
3. Never change URLs, image paths, code blocks, inline code, or HTML tags. Translate only link text and image alt text.
4. Keep common technical terms in English (AI, API, agent, prompt...).
5. If a source field is empty, return an empty string for it.
Respond with JSON only: {"title": "...", "excerpt": "...", "content": "..."}`

  const user = JSON.stringify({ title: input.title, excerpt: input.excerpt, content: input.content })

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ]
}

export function parseTranslationResponse(
  raw: string | null | undefined,
  finishReason: string | null | undefined,
  input: TranslateInput
): Omit<TranslateResult, 'warnings'> {
  if (finishReason === 'length') {
    throw new Error('Translation was cut off because the post is too long for one request')
  }

  let parsed: any
  try {
    parsed = JSON.parse(raw || '')
  } catch {
    throw new Error('AI returned invalid JSON')
  }

  // Only keep fields whose source had text, so the model cannot invent an excerpt or body.
  const title = input.title ? str(parsed?.title).trim() : ''
  const excerpt = input.excerpt ? str(parsed?.excerpt).trim() : ''
  const content = input.content.trim() ? str(parsed?.content) : ''

  if (input.title && !title) throw new Error('AI returned an empty title')
  if (input.excerpt && !excerpt) throw new Error('AI returned an empty excerpt')
  if (input.content.trim() && !content.trim()) throw new Error('AI returned empty content')

  return { title, excerpt, content }
}

function countMatches(text: string, pattern: RegExp) {
  return (text.match(pattern) || []).length
}

const STRUCTURE_CHECKS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'headings', pattern: /^#{1,6}\s/gm },
  { label: 'links', pattern: /(?<!!)\[[^\]]*\]\([^)]+\)/g },
  { label: 'images', pattern: /!\[[^\]]*\]\([^)]+\)/g },
  { label: 'code blocks', pattern: /^```/gm },
]

/** Lists Markdown elements whose count changed, so the admin knows what to double-check. */
export function compareMarkdownStructure(source: string, translated: string): string[] {
  const warnings: string[] = []
  for (const { label, pattern } of STRUCTURE_CHECKS) {
    const before = countMatches(source, pattern)
    const after = countMatches(translated, pattern)
    if (before !== after) warnings.push(`${label}: ${before} → ${after}`)
  }
  return warnings
}

export async function translateBlogFields(
  input: TranslateInput,
  client: Pick<OpenAI, 'chat'> = getOpenAIClient()
): Promise<TranslateResult> {
  const response = await client.chat.completions.create({
    model: AI_MODEL,
    ...reasoningParams(),
    messages: buildMessages(input),
    response_format: { type: 'json_object' },
    max_completion_tokens: MAX_OUTPUT_TOKENS,
  })

  const choice = response.choices[0]
  const result = parseTranslationResponse(choice?.message?.content, choice?.finish_reason, input)

  return { ...result, warnings: compareMarkdownStructure(input.content, result.content) }
}
