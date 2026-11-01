/**
 * Reads the queue table in docs/research/weekly/QUESTIONS.md (super-app). The real
 * review state lives there: card frontmatter always says `status: draft`.
 * Columns are found by header name, so adding or moving a column is harmless.
 * Anything unclear becomes `unknown`, which readers never see.
 */

export type CardStatus = 'draft' | 'approved' | 'dropped' | 'unknown'

export interface QueueEntry {
  status: CardStatus
  topics: string[]
}

const KNOWN: CardStatus[] = ['draft', 'approved', 'dropped']

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

/** Map of card file name (no ".md") → queue entry. */
export function parseQuestions(raw: string): Map<string, QueueEntry> {
  const out = new Map<string, QueueEntry>()
  const conflicted = new Set<string>()
  const lines = raw.split('\n')

  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) continue
    const header = cells(lines[i])
    const statusCol = header.indexOf('Trạng thái')
    const cardCol = header.indexOf('Phiếu')
    const topicCol = header.indexOf('Chủ đề')
    if (statusCol === -1 || cardCol === -1) continue

    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const row = cells(lines[j])
      const link = row[cardCol]?.match(/\(([^)\s]+)\.md\)/)
      if (!link) continue
      const file = link[1].split('/').pop()!

      const token = row[statusCol]?.match(/^`([^`]+)`/)?.[1]
      const status: CardStatus = KNOWN.includes(token as CardStatus) ? (token as CardStatus) : 'unknown'
      const topics =
        topicCol === -1
          ? []
          : (row[topicCol] ?? '')
              .split(/[,;]/)
              .map((t) => t.trim())
              .filter((t) => t && t !== '—' && t !== '-')

      const previous = out.get(file)
      if (previous && previous.status !== status) conflicted.add(file)
      out.set(file, { status, topics: previous && !topics.length ? previous.topics : topics })
    }
    i++
  }

  for (const file of conflicted) out.get(file)!.status = 'unknown'
  return out
}
