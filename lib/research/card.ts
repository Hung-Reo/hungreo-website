/**
 * Reader for weekly education research cards (private super-app repo,
 * docs/research/weekly/EDU-YYYY-Www_vN.md). Splits a card the same way
 * tools/research-card/validate.mjs does, but never judges it: the validator and the
 * Telegram review stay the gate. Anything that does not fit the expected shape is
 * kept as plain markdown so the reader never loses text.
 */

import { createHash } from 'crypto'

const CARD_NAME = /^EDU-\d{4}-W\d{2}[a-z]?_v\d+$/
const IDEA_LINE = /^- \*\*(fact|inference|idea):\*\*\s*(.*)$/
const CERTAINTY = /\s*·?\s*độ chắc: (cao|vừa|thấp|rất thấp)(?=\s|$)\s*(?:—\s*(.*))?$/
const READING_LEVELS = ['toàn văn', 'phần liên quan', 'abstract', 'tóm tắt thứ cấp'] as const
const IDEA_SECTIONS = new Set(['3 ý chính', 'Một cách thử'])

export type IdeaLabel = 'fact' | 'inference' | 'idea'
export type Certainty = 'cao' | 'vừa' | 'thấp' | 'rất thấp'
export type ReadingLevel = (typeof READING_LEVELS)[number]

export interface Idea {
  label: IdeaLabel
  text: string
  certainty?: Certainty
  certaintyReason?: string
  parts: { sourceSays?: string; example?: string; whyItMatters?: string }
  /** Indented lines that are none of the three parts. */
  more: string[]
}

export type Section =
  | { kind: 'ideas'; title: string; ideas: Idea[]; extra: string }
  | { kind: 'markdown'; title: string; markdown: string }

export interface Source {
  n: number
  parsed: boolean
  raw: string
  /** Everything before "— kiểm", may hold several links. */
  headMarkdown: string
  title?: string
  url?: string
  checked?: string
  readingLevel?: ReadingLevel
  readingDetail?: string
  population?: string
}

export interface CardMeta {
  id?: string
  version?: number
  format: 1 | 2
  question?: string
  checked?: string
  model?: string
}

export interface ResearchCard {
  meta: CardMeta
  title?: string
  intro: string
  sections: Section[]
  sources: Source[]
  /** Lines of "## Nguồn" that are not numbered sources (notes, wrapped lines), kept verbatim. */
  sourcesExtra: string
  sha256: string
}

/** Card file name without ".md". Also the only shape a URL segment may take. */
export function isCardFileName(name: string): boolean {
  return CARD_NAME.test(name)
}

function parseFrontmatter(raw: string): { fields: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { fields: {}, body: raw }
  const fields: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/)
    if (!m) continue
    let value = m[2].trim()
    if (value.startsWith('"')) {
      try {
        value = JSON.parse(value)
      } catch {
        // keep raw, like the validator
      }
    }
    fields[m[1]] = value
  }
  return { fields, body: raw.slice(match[0].length) }
}

function splitSections(body: string): { intro: string; parts: { title: string; text: string }[] } {
  const chunks = body.split(/^## /m)
  const parts = chunks.slice(1).map((part) => {
    const newline = part.indexOf('\n')
    return {
      title: (newline === -1 ? part : part.slice(0, newline)).trim(),
      text: newline === -1 ? '' : part.slice(newline + 1),
    }
  })
  return { intro: chunks[0], parts }
}

function parseIdeas(title: string, text: string): Section {
  const ideas: Idea[] = []
  const extra: string[] = []
  let current: Idea | null = null

  for (const line of text.split('\n')) {
    const head = line.match(IDEA_LINE)
    if (head) {
      const certainty = head[2].match(CERTAINTY)
      current = {
        label: head[1] as IdeaLabel,
        text: certainty ? head[2].slice(0, certainty.index).trim() : head[2].trim(),
        certainty: certainty?.[1] as Certainty | undefined,
        certaintyReason: certainty?.[2]?.trim() || undefined,
        parts: {},
        more: [],
      }
      ideas.push(current)
    } else if (current && /^\s+\S/.test(line)) {
      const item = line.trim().replace(/^- /, '')
      const part = item.match(/^(Nguồn nói|Ví dụ \(mình dựng\)|Vì sao quan trọng):\s*(.*)$/)
      if (part?.[1] === 'Nguồn nói') current.parts.sourceSays = part[2]
      else if (part?.[1] === 'Ví dụ (mình dựng)') current.parts.example = part[2]
      else if (part?.[1] === 'Vì sao quan trọng') current.parts.whyItMatters = part[2]
      else current.more.push(item)
    } else if (line.trim()) {
      current = null
      extra.push(line)
    }
  }

  if (!ideas.length) return { kind: 'markdown', title, markdown: text }
  return { kind: 'ideas', title, ideas, extra: extra.join('\n') }
}

function parseSource(n: number, raw: string): Source {
  const fallback: Source = { n, parsed: false, raw, headMarkdown: raw }
  const cut = raw.indexOf(' — kiểm ')
  if (cut === -1) return fallback

  const headMarkdown = raw.slice(0, cut).trim()
  const link = headMarkdown.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/)
  const source: Source = { n, parsed: true, raw, headMarkdown, title: link?.[1], url: link?.[2] }

  for (const segment of raw.slice(cut + 3).split(' — ')) {
    const s = segment.trim()
    const checked = s.match(/^kiểm (\d{4}-\d{2}-\d{2})/)
    if (checked) source.checked = checked[1]
    else if (s.startsWith('đọc: ')) {
      const rest = s.slice('đọc: '.length)
      const level = READING_LEVELS.find((l) => rest.startsWith(l))
      if (level) {
        source.readingLevel = level
        source.readingDetail = rest.slice(level.length).trim() || undefined
      } else source.readingDetail = rest
    } else if (s.startsWith('đối tượng:')) source.population = s.slice('đối tượng:'.length).trim()
  }
  return source
}

export function parseCard(raw: string): ResearchCard {
  const { fields, body } = parseFrontmatter(raw.replace(/\r\n/g, '\n'))
  const { intro, parts } = splitSections(body)
  const version = Number(fields.version)

  const sections: Section[] = []
  let sources: Source[] = []
  let sourcesExtra = ''
  for (const { title, text } of parts) {
    if (title === 'Nguồn') {
      const lines = text.split('\n')
      const numbered = lines.filter((l) => /^\d+\.\s/.test(l))
      if (numbered.length) {
        sources = numbered.map((l) => {
          const m = l.match(/^(\d+)\.\s+(.*)$/)!
          return parseSource(Number(m[1]), m[2].trim())
        })
        sourcesExtra = lines.filter((l) => !/^\d+\.\s/.test(l)).join('\n').trim()
        continue
      }
    }
    sections.push(IDEA_SECTIONS.has(title) ? parseIdeas(title, text) : { kind: 'markdown', title, markdown: text })
  }

  const titleMatch = intro.match(/^# (.+)$/m)
  return {
    meta: {
      id: fields.id || undefined,
      version: Number.isInteger(version) && version >= 1 ? version : undefined,
      format: fields.format === '2' ? 2 : 1,
      question: fields.question || undefined,
      checked: fields.checked || undefined,
      model: fields.model || undefined,
    },
    title: titleMatch?.[1].trim(),
    intro: intro.replace(/^# .+$/m, '').trim(),
    sections,
    sources,
    sourcesExtra,
    sha256: createHash('sha256').update(raw, 'utf8').digest('hex'),
  }
}
