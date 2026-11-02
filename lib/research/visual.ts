/**
 * Derives the one-screen visual summary of a card (tiles + "which idea rests on
 * which source") from the parsed card alone. Cards may not carry images (the
 * validator blocks them for privacy), so every visual is computed here and the
 * card file stays untouched.
 */

import type { Idea, ResearchCard, Source } from './card'

// Long enough to keep a whole first clause (cutting mid-phrase read badly on real cards).
const MAX_WORDS = 28

/** First clause of an idea, without citations or markdown, capped for a tile. */
export function shortHeadline(text: string): string {
  const plain = text
    .replace(/\[\d{1,2}\]/g, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  const clause = plain.split(/;\s|\.\s|:\s/)[0].replace(/[.;:,\s]+$/, '')
  const words = clause.split(' ')
  return words.length > MAX_WORDS ? `${words.slice(0, MAX_WORDS).join(' ')}…` : clause
}

export function citationsOf(idea: Idea): number[] {
  const text = [idea.text, idea.parts.sourceSays, idea.parts.example, idea.parts.whyItMatters, ...idea.more].join(' ')
  return [...new Set([...text.matchAll(/\[(\d{1,2})\](?!\()/g)].map((m) => Number(m[1])))].sort((a, b) => a - b)
}

/** Short source name: the part of the title before " — " or the first comma. */
export function sourceShortName(source: Source): string {
  const title = source.title ?? source.raw.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  const name = title.split(/\s—\s|,\s/)[0].trim()
  return name.length > 32 ? `${name.slice(0, 31)}…` : name
}

export function isStrongSource(source: Source): boolean {
  return source.readingLevel === 'toàn văn' || source.readingLevel === 'phần liên quan'
}

export interface CardVisual {
  facts: { idea: Idea; headline: string; sources: Source[] }[]
  inference?: string
  tryAtHome?: string
}

export function buildVisual(card: ResearchCard): CardVisual | null {
  const main = card.sections.find((s) => s.title === '3 ý chính')
  if (!main || main.kind !== 'ideas') return null
  const byNumber = new Map(card.sources.map((s) => [s.n, s]))

  const facts = main.ideas
    .filter((i) => i.label === 'fact')
    .map((idea) => ({
      idea,
      headline: shortHeadline(idea.text),
      sources: citationsOf(idea).map((n) => byNumber.get(n)).filter((s): s is Source => !!s),
    }))
  if (!facts.length) return null

  const inference = main.ideas.find((i) => i.label === 'inference')
  const tryIt = card.sections.find((s) => s.title === 'Một cách thử')
  const firstIdea = tryIt?.kind === 'ideas' ? tryIt.ideas.find((i) => i.label === 'idea') : undefined

  return {
    facts,
    inference: inference ? shortHeadline(inference.text.replace(/^Ghép[^:]*:\s*/i, '')) : undefined,
    tryAtHome: firstIdea ? shortHeadline(firstIdea.text.replace(/^\([^)]*\)\s*/, '')) : undefined,
  }
}
