'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { CardSummary } from '@/lib/research/repository'
import type { CardStatus } from '@/lib/research/questions'
import { StatusBadge, STATUS_TEXT } from './Badges'

// The list arrives already filtered by role on the server; filters here only
// narrow what the viewer is allowed to see anyway.

export function ResearchIndex({ cards, showStatusFilter }: { cards: CardSummary[]; showStatusFilter: boolean }) {
  const [status, setStatus] = useState<CardStatus | 'all'>('all')
  const [topic, setTopic] = useState('all')
  const [query, setQuery] = useState('')

  const topics = useMemo(() => [...new Set(cards.flatMap((c) => c.topics))].sort((a, b) => a.localeCompare(b, 'vi')), [cards])
  const statuses = useMemo(() => [...new Set(cards.map((c) => c.status))], [cards])

  const shown = cards.filter((c) => {
    if (status !== 'all' && c.status !== status) return false
    if (topic !== 'all' && !c.topics.includes(topic)) return false
    const q = query.trim().toLowerCase()
    if (q && ![c.title, c.question, c.id].some((v) => v?.toLowerCase().includes(q))) return false
    return true
  })

  const select = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tiêu đề, câu hỏi…"
          className={`${select} sm:min-w-[16rem] sm:flex-1`}
        />
        {showStatusFilter && (
          <select value={status} onChange={(e) => setStatus(e.target.value as CardStatus | 'all')} className={select}>
            <option value="all">Mọi trạng thái</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_TEXT[s]}
              </option>
            ))}
          </select>
        )}
        {topics.length > 0 && (
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={select}>
            <option value="all">Mọi chủ đề</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      <p className="text-sm text-slate-500">
        {shown.length} / {cards.length} phiếu
      </p>

      <ul className="space-y-3">
        {shown.map((c) => (
          <li key={c.file}>
            <Link
              href={`/family/research/${c.file}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary-300 hover:shadow"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <StatusBadge status={c.status} />
                <span className="font-mono">{c.id ?? c.file}</span>
                {c.checked && <span>· kiểm {c.checked}</span>}
                <span>· {c.sourceCount} nguồn</span>
              </div>
              <p className="font-semibold text-slate-900">{c.title ?? c.file}</p>
              {c.question && <p className="mt-1 text-sm text-slate-600">{c.question}</p>}
              {c.topics.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.topics.map((t) => (
                    <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
