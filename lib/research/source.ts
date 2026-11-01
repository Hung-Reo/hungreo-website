/**
 * Where research cards are read from, at request time only (never at build):
 * - local: RESEARCH_CARDS_DIR on Hưng's Mac, dev server only. Sees cards the
 *   scheduled task wrote at 02:00 before anything is committed.
 * - github: the private super-app repo through a read-only token
 *   (RESEARCH_GITHUB_TOKEN). Sees only what was pushed to the ref.
 * Neither configured → no source, and every research page 404s.
 *
 * Both are locked to the research folder and to card names; nothing from the
 * request is ever joined into a path.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { isCardFileName } from './card'

const REMOTE_DIR = 'docs/research/weekly'
const QUESTIONS_FILE = 'QUESTIONS.md'
const MAX_BYTES = 32_768

export interface CardSource {
  kind: 'local' | 'github'
  label: string
  /** Card file names without ".md". */
  listCards(): Promise<string[]>
  /** `name` is a card file name (no ".md") or QUESTIONS_FILE. */
  read(name: string): Promise<string | null>
}

function isAllowedFile(name: string): boolean {
  return name === QUESTIONS_FILE || isCardFileName(name)
}

function fileOf(name: string): string {
  return name === QUESTIONS_FILE ? name : `${name}.md`
}

function localSource(dir: string): CardSource {
  return {
    kind: 'local',
    label: 'thư mục super-app trên máy (local)',
    async listCards() {
      const names = await fs.readdir(dir)
      return names.filter((n) => n.endsWith('.md')).map((n) => n.slice(0, -3)).filter(isCardFileName)
    },
    async read(name) {
      if (!isAllowedFile(name)) return null
      const file = path.join(dir, fileOf(name))
      try {
        const stat = await fs.stat(file)
        if (!stat.isFile() || stat.size > MAX_BYTES) return null
        return await fs.readFile(file, 'utf8')
      } catch {
        return null
      }
    },
  }
}

function githubSource(token: string, repo: string, ref: string): CardSource {
  const base = `https://api.github.com/repos/${repo}/contents/${REMOTE_DIR}`
  const headers = {
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hungreo-website',
  }
  return {
    kind: 'github',
    label: `GitHub ${ref} — chỉ có phiếu đã push`,
    async listCards() {
      const res = await fetch(`${base}?ref=${encodeURIComponent(ref)}`, {
        headers: { ...headers, Accept: 'application/vnd.github+json' },
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`GitHub list failed: ${res.status}`)
      const items = (await res.json()) as { name: string; type: string }[]
      return items
        .filter((i) => i.type === 'file' && i.name.endsWith('.md'))
        .map((i) => i.name.slice(0, -3))
        .filter(isCardFileName)
    },
    async read(name) {
      if (!isAllowedFile(name)) return null
      const res = await fetch(`${base}/${fileOf(name)}?ref=${encodeURIComponent(ref)}`, {
        headers: { ...headers, Accept: 'application/vnd.github.raw+json' },
        cache: 'no-store',
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`GitHub read failed: ${res.status}`)
      const text = await res.text()
      return Buffer.byteLength(text, 'utf8') > MAX_BYTES ? null : text
    },
  }
}

export function getCardSource(): CardSource | null {
  const dir = process.env.RESEARCH_CARDS_DIR
  if (dir && process.env.NODE_ENV !== 'production') return localSource(dir)

  const token = process.env.RESEARCH_GITHUB_TOKEN
  const repo = process.env.RESEARCH_GITHUB_REPO || 'Hung-Reo/hungreo-super-app'
  const ref = process.env.RESEARCH_GITHUB_REF || 'main'
  if (token && /^[\w.-]+\/[\w.-]+$/.test(repo) && /^[\w./-]+$/.test(ref) && !ref.includes('..')) {
    return githubSource(token, repo, ref)
  }
  return null
}

export { QUESTIONS_FILE }
