import type { Certainty, IdeaLabel, ReadingLevel } from '@/lib/research/card'
import type { CardStatus } from '@/lib/research/questions'

const LABELS: Record<IdeaLabel, { text: string; className: string }> = {
  fact: { text: 'Sự thật · có nguồn', className: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  inference: { text: 'Suy luận', className: 'bg-amber-100 text-amber-800 ring-amber-200' },
  idea: { text: 'Ý tưởng thử', className: 'bg-sky-100 text-sky-800 ring-sky-200' },
}

export function LabelChip({ label }: { label: IdeaLabel }) {
  const { text, className } = LABELS[label]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${className}`}>
      {text}
    </span>
  )
}

const CERTAINTY_LEVEL: Record<Certainty, { dots: number; className: string }> = {
  cao: { dots: 4, className: 'text-emerald-600' },
  vừa: { dots: 3, className: 'text-lime-600' },
  thấp: { dots: 2, className: 'text-amber-600' },
  'rất thấp': { dots: 1, className: 'text-red-600' },
}

export function CertaintyMeter({ certainty, reason }: { certainty: Certainty; reason?: string }) {
  const { dots, className } = CERTAINTY_LEVEL[certainty]
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-medium text-slate-700">Độ chắc:</span>
      <span className={`tracking-widest ${className}`} aria-hidden>
        {'●'.repeat(dots)}
        <span className="text-slate-300">{'●'.repeat(4 - dots)}</span>
      </span>
      <span className={`font-semibold ${className}`}>{certainty}</span>
      {reason && <span className="text-slate-500">— {reason}</span>}
    </div>
  )
}

const STATUS: Record<CardStatus, { text: string; className: string }> = {
  approved: { text: 'Đã duyệt', className: 'bg-emerald-600 text-white' },
  draft: { text: 'Nháp · chờ duyệt', className: 'bg-slate-200 text-slate-700' },
  dropped: { text: 'Không giữ', className: 'bg-red-100 text-red-700' },
  unknown: { text: 'Chưa rõ trạng thái', className: 'bg-amber-100 text-amber-800' },
}

export function StatusBadge({ status }: { status: CardStatus }) {
  const { text, className } = STATUS[status]
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${className}`}>{text}</span>
}

export const STATUS_TEXT: Record<CardStatus, string> = {
  approved: STATUS.approved.text,
  draft: STATUS.draft.text,
  dropped: STATUS.dropped.text,
  unknown: STATUS.unknown.text,
}

const READING: Record<ReadingLevel, string> = {
  'toàn văn': 'bg-emerald-700 text-white',
  'phần liên quan': 'bg-emerald-200 text-emerald-900',
  abstract: 'bg-amber-100 text-amber-900',
  'tóm tắt thứ cấp': 'bg-slate-100 text-slate-600',
}

export function ReadingChip({ level }: { level: ReadingLevel }) {
  return <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${READING[level]}`}>Đọc: {level}</span>
}
