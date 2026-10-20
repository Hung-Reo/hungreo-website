/**
 * Living Thought fields for blog posts: when it happened, the context, Hung's
 * own words kept verbatim, AI editorial notes kept apart from them, and how the
 * thinking changed over time. Uncertainties are admin-only questions the AI
 * could not answer from the original words; publishing waits until each one is
 * resolved, so a guess never goes out as Hung's opinion.
 *
 * Pure helpers (no KV import) so API routes and tests share one validator.
 */

import { randomUUID } from 'crypto'

export interface LivingThoughtSection {
  context: string
  originalVoice: string
  aiEditorial: string
}

export interface LivingThoughtContent {
  en: LivingThoughtSection
  vi: LivingThoughtSection
}

export interface ThoughtEvolutionEntry {
  id: string
  date: string // YYYY-MM-DD
  noteVi: string
  noteEn: string
}

export interface Uncertainty {
  id: string
  question: string
  resolved: boolean
  resolutionNote?: string
}

export interface LivingThoughtFields {
  occurredAt?: string
  structuredContent?: LivingThoughtContent
  thoughtEvolution?: ThoughtEvolutionEntry[]
  uncertainties?: Uncertainty[]
}

const MAX_TEXT = 20000
const MAX_SHORT_TEXT = 2000
const MAX_ITEMS = 50
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown, max = MAX_TEXT): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return undefined
  return Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ? undefined : value
}

function section(value: unknown): LivingThoughtSection {
  const source = isRecord(value) ? value : {}
  return {
    context: text(source.context),
    originalVoice: text(source.originalVoice),
    aiEditorial: text(source.aiEditorial),
  }
}

function hasText(s: LivingThoughtSection): boolean {
  return Boolean(s.context || s.originalVoice || s.aiEditorial)
}

/**
 * Keeps only well-formed living thought fields from an untrusted request body.
 * A field missing from the input stays missing in the output, so a PUT that
 * omits it keeps the stored value; a field sent as junk becomes empty.
 */
export function normalizeLivingThought(input: unknown): LivingThoughtFields {
  const body = isRecord(input) ? input : {}
  const out: LivingThoughtFields = {}

  if ('occurredAt' in body) {
    out.occurredAt = validDate(body.occurredAt)
  }

  if ('structuredContent' in body) {
    const raw = isRecord(body.structuredContent) ? body.structuredContent : null
    const content = raw ? { en: section(raw.en), vi: section(raw.vi) } : null
    out.structuredContent =
      content && (hasText(content.en) || hasText(content.vi)) ? content : undefined
  }

  if ('thoughtEvolution' in body) {
    const list = Array.isArray(body.thoughtEvolution) ? body.thoughtEvolution : []
    out.thoughtEvolution = list
      .filter(isRecord)
      .map((entry) => ({
        id: text(entry.id, 100) || randomUUID(),
        date: validDate(entry.date) || '',
        noteVi: text(entry.noteVi, MAX_SHORT_TEXT),
        noteEn: text(entry.noteEn, MAX_SHORT_TEXT),
      }))
      .filter((entry) => entry.date && (entry.noteVi || entry.noteEn))
      .slice(0, MAX_ITEMS)
  }

  if ('uncertainties' in body) {
    const list = Array.isArray(body.uncertainties) ? body.uncertainties : []
    out.uncertainties = list
      .filter(isRecord)
      .map((item) => {
        const note = text(item.resolutionNote, MAX_SHORT_TEXT)
        return {
          id: text(item.id, 100) || randomUUID(),
          question: text(item.question, MAX_SHORT_TEXT),
          resolved: item.resolved === true,
          ...(note ? { resolutionNote: note } : {}),
        }
      })
      .filter((item) => item.question)
      .slice(0, MAX_ITEMS)
  }

  return out
}

export function getUnresolvedUncertainties(post: { uncertainties?: Uncertainty[] }): Uncertainty[] {
  return (post.uncertainties || []).filter((item) => item.resolved !== true)
}

/** Error message when a post may not be saved as published, otherwise null. */
export function getPublishBlockError(post: {
  status: string
  uncertainties?: Uncertainty[]
}): string | null {
  if (post.status !== 'published') return null
  const open = getUnresolvedUncertainties(post).length
  if (open === 0) return null
  return `Cannot publish: ${open} unresolved uncertainty item(s). Resolve them or save as draft.`
}
