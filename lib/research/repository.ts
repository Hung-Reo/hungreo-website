/**
 * Server-only entry point for the /family/research pages: who is looking, and
 * which cards they may read. Readers are filtered BEFORE a card is fetched, so a
 * draft never leaves the source for them. Not to be imported from app/api (the
 * privacy guard test enforces it): pages render HTML, no route hands out JSON.
 *
 * Dev server caveat (seen 01/11/2026): React 19 dev builds embed the results of
 * server-side awaits (QUESTIONS.md, card text) in the page as debug info, so in
 * `next dev` a reader's 404 still carries that text. Production builds do not
 * (checked with `next start`). Readers therefore exist only on the deployed site.
 */

import { auth } from '@/lib/auth'
import { familyAllowlist, readerCanSee, viewerRole, type Role } from './access'
import { parseCard, isCardFileName, type ResearchCard } from './card'
import { parseQuestions, type CardStatus, type QueueEntry } from './questions'
import { getCardSource, QUESTIONS_FILE, type CardSource } from './source'

export interface Viewer {
  role: Role
}

export interface CardSummary {
  file: string
  id?: string
  version?: number
  format: 1 | 2
  title?: string
  question?: string
  checked?: string
  status: CardStatus
  topics: string[]
  sourceCount: number
}

export async function getViewer(): Promise<Viewer | null> {
  const session = await auth()
  const role = viewerRole(session?.user as { role?: unknown; email?: unknown } | undefined, familyAllowlist())
  return role ? { role } : null
}

async function loadQueue(source: CardSource): Promise<Map<string, QueueEntry>> {
  const raw = await source.read(QUESTIONS_FILE)
  return raw ? parseQuestions(raw) : new Map()
}

function entryOf(queue: Map<string, QueueEntry>, file: string): QueueEntry {
  return queue.get(file) ?? { status: 'unknown', topics: [] }
}

export async function listCards(viewer: Viewer): Promise<{ sourceLabel: string; cards: CardSummary[] } | null> {
  const source = getCardSource()
  if (!source) return null

  const [queue, files] = await Promise.all([loadQueue(source), source.listCards()])
  const visible = viewer.role === 'admin' ? files : files.filter((f) => readerCanSee(entryOf(queue, f).status))

  const cards = await Promise.all(
    visible.map(async (file): Promise<CardSummary | null> => {
      const raw = await source.read(file)
      if (!raw) return null
      const card = parseCard(raw)
      const entry = entryOf(queue, file)
      return {
        file,
        ...card.meta,
        title: card.title,
        status: entry.status,
        topics: entry.topics,
        sourceCount: card.sources.length,
      }
    })
  )

  return {
    sourceLabel: source.label,
    cards: cards
      .filter((c): c is CardSummary => c !== null)
      .sort((a, b) => (b.checked ?? '').localeCompare(a.checked ?? '') || b.file.localeCompare(a.file)),
  }
}

export async function getCard(
  file: string,
  viewer: Viewer
): Promise<{ sourceLabel: string; card: ResearchCard; status: CardStatus; topics: string[] } | null> {
  if (!isCardFileName(file)) return null
  const source = getCardSource()
  if (!source) return null

  const entry = entryOf(await loadQueue(source), file)
  if (viewer.role !== 'admin' && !readerCanSee(entry.status)) return null

  const raw = await source.read(file)
  if (!raw) return null
  return { sourceLabel: source.label, card: parseCard(raw), status: entry.status, topics: entry.topics }
}
