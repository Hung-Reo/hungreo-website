import { ArrowDown, BookOpen, Home, Merge } from 'lucide-react'
import type { Certainty, ResearchCard } from '@/lib/research/card'
import { buildVisual, isStrongSource, sourceShortName } from '@/lib/research/visual'

// One-screen picture of a card: main facts as tiles, how they combine, what to
// try at home, and which idea rests on which source. Drawn from the card text;
// HTML rather than SVG so labels stay readable on a phone.

const CERTAINTY_DOTS: Record<Certainty, { dots: number; className: string }> = {
  cao: { dots: 4, className: 'text-emerald-600' },
  vừa: { dots: 3, className: 'text-lime-600' },
  thấp: { dots: 2, className: 'text-amber-600' },
  'rất thấp': { dots: 1, className: 'text-red-600' },
}

function Dots({ certainty }: { certainty: Certainty }) {
  const { dots, className } = CERTAINTY_DOTS[certainty]
  return (
    <span className={`text-xs font-semibold ${className}`}>
      <span className="tracking-widest" aria-hidden>
        {'●'.repeat(dots)}
        <span className="text-slate-300">{'●'.repeat(4 - dots)}</span>
      </span>{' '}
      {certainty}
    </span>
  )
}

export function CardSummary({ card }: { card: ResearchCard }) {
  const visual = buildVisual(card)
  if (!visual) return null

  return (
    <section aria-label="Tóm tắt trực quan" className="space-y-4">
      <div className="rounded-xl bg-slate-100 p-4 sm:p-5">
        <p className="mb-3 text-sm font-medium text-slate-600">Tóm tắt 1 màn hình</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {visual.facts.map(({ idea, headline }, i) => (
            <a
              key={i}
              href={`#idea-${i + 1}`}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 no-underline transition hover:border-emerald-300"
            >
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <BookOpen className="h-3.5 w-3.5" /> Sự thật {i + 1}
              </span>
              <span className="flex-1 text-[15px] font-medium leading-snug text-slate-900">{headline}</span>
              {idea.certainty && (
                <span className="mt-2">
                  <Dots certainty={idea.certainty} />
                </span>
              )}
            </a>
          ))}
        </div>

        {visual.inference && (
          <>
            <ArrowDown className="mx-auto my-1.5 h-5 w-5 text-slate-400" aria-hidden />
            <div className="flex items-start gap-2 rounded-xl bg-amber-100 p-3 text-[15px] text-amber-900">
              <Merge className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">Ghép lại: </span>
                {visual.inference}
              </span>
            </div>
          </>
        )}

        {visual.tryAtHome && (
          <>
            <ArrowDown className="mx-auto my-1.5 h-5 w-5 text-slate-400" aria-hidden />
            <div className="flex items-start gap-2 rounded-xl bg-sky-100 p-3 text-[15px] text-sky-900">
              <Home className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <span className="font-semibold">Thử ở nhà: </span>
                {visual.tryAtHome}
              </span>
            </div>
          </>
        )}
      </div>

      {visual.facts.some((f) => f.sources.length > 0) && (
        <div className="rounded-xl bg-slate-100 p-4 sm:p-5">
          <p className="mb-3 text-sm font-medium text-slate-600">Bản đồ nguồn · mỗi ý dựa vào nguồn nào</p>
          <ul className="space-y-2">
            {visual.facts.map(({ sources }, i) => (
              <li key={i} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="w-16 shrink-0 text-sm font-semibold text-slate-700">Ý {i + 1}</span>
                <span className="hidden text-slate-400 sm:inline" aria-hidden>
                  ←
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {sources.length === 0 && <span className="text-sm text-slate-500">không ghi nguồn</span>}
                  {sources.map((s) => (
                    <a
                      key={s.n}
                      href={`#src-${s.n}`}
                      title={s.title}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs no-underline ${
                        isStrongSource(s)
                          ? 'bg-emerald-600 text-white'
                          : 'border border-dashed border-slate-400 bg-white text-slate-700'
                      }`}
                    >
                      <span className="font-bold">[{s.n}]</span> {sourceShortName(s)}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Nền xanh = nguồn đã đọc kỹ (toàn văn / phần liên quan) · viền đứt = chỉ đọc tóm tắt hoặc abstract
          </p>
        </div>
      )}
    </section>
  )
}
