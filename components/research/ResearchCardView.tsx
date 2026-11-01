import { BookOpen, Lightbulb, PenLine, AlertTriangle } from 'lucide-react'
import type { Idea, ResearchCard, Section, Source } from '@/lib/research/card'
import type { CardStatus } from '@/lib/research/questions'
import { CertaintyMeter, LabelChip, ReadingChip, StatusBadge } from './Badges'
import { Markdown, linkCitations } from './Markdown'

// Shared by the private /family/research pages and, later, the public /research
// section: no auth, no data fetching, only rendering of an already-parsed card.

type Cite = (text: string) => string

function IdeaBlock({ idea, cite }: { idea: Idea; cite: Cite }) {
  const { sourceSays, example, whyItMatters } = idea.parts
  const accent =
    idea.label === 'fact' ? 'border-l-emerald-500' : idea.label === 'inference' ? 'border-l-amber-500' : 'border-l-sky-500 bg-sky-50/40'

  return (
    <article className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm sm:p-5 ${accent}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <LabelChip label={idea.label} />
      </div>
      <div className="prose prose-slate max-w-none text-[17px] leading-relaxed">
        <Markdown>{cite(idea.text)}</Markdown>
      </div>
      {idea.certainty && (
        <div className="mt-3">
          <CertaintyMeter certainty={idea.certainty} reason={idea.certaintyReason} />
        </div>
      )}

      {(sourceSays || example || whyItMatters) && (
        <div className="mt-4 space-y-3">
          {sourceSays && (
            <div className="rounded-md border border-slate-300 bg-slate-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <BookOpen className="h-4 w-4" /> Nguồn nói
              </p>
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown>{cite(sourceSays)}</Markdown>
              </div>
            </div>
          )}
          {example && (
            <div className="rounded-md border-2 border-dashed border-violet-300 bg-violet-50/50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-violet-800">
                <PenLine className="h-4 w-4" /> Ví dụ (mình dựng)
                <span className="font-normal text-violet-600">— tình huống tưởng tượng, không phải dữ liệu</span>
              </p>
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown>{cite(example)}</Markdown>
              </div>
            </div>
          )}
          {whyItMatters && (
            <div className="rounded-md border border-primary-200 bg-primary-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-primary-800">
                <Lightbulb className="h-4 w-4" /> Vì sao quan trọng
              </p>
              <div className="prose prose-slate prose-sm max-w-none">
                <Markdown>{cite(whyItMatters)}</Markdown>
              </div>
            </div>
          )}
        </div>
      )}

      {idea.more.length > 0 && (
        <div className="prose prose-slate prose-sm mt-3 max-w-none">
          <Markdown>{cite(idea.more.map((l) => `- ${l}`).join('\n'))}</Markdown>
        </div>
      )}
    </article>
  )
}

function SectionBlock({ section, cite }: { section: Section; cite: Cite }) {
  if (section.kind === 'ideas') {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
        {section.ideas.map((idea, i) => (
          <IdeaBlock key={i} idea={idea} cite={cite} />
        ))}
        {section.extra && (
          <div className="prose prose-slate max-w-none">
            <p className="text-xs text-slate-400">Không tách được khối, hiện nguyên văn:</p>
            <Markdown>{cite(section.extra)}</Markdown>
          </div>
        )}
      </section>
    )
  }

  const body = (
    <div className="prose prose-slate max-w-none">
      <Markdown>{cite(section.markdown)}</Markdown>
    </div>
  )

  if (section.title === 'Giới hạn') {
    return (
      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 sm:p-5">
        <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-amber-900">
          <AlertTriangle className="h-5 w-5" /> Giới hạn
        </h2>
        {body}
      </section>
    )
  }
  if (section.title === 'Hưng nhìn lại') {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <h2 className="mb-2 text-xl font-bold text-slate-900">Hưng nhìn lại</h2>
        {body}
        <p className="mt-2 text-xs text-slate-500">Chỉ đọc. Phần này Hưng viết trong file phiếu.</p>
      </section>
    )
  }
  return (
    <section>
      <h2 className="mb-2 text-xl font-bold text-slate-900">{section.title}</h2>
      {body}
    </section>
  )
}

function SourceItem({ source }: { source: Source }) {
  return (
    <li id={`src-${source.n}`} className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4 target:ring-2 target:ring-primary-400">
      <div className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">
          {source.n}
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="prose prose-slate prose-sm max-w-none break-words font-medium">
            <Markdown>{source.parsed ? source.headMarkdown : source.raw}</Markdown>
          </div>
          {source.parsed && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              {source.readingLevel && <ReadingChip level={source.readingLevel} />}
              {source.checked && <span>Kiểm {source.checked}</span>}
            </div>
          )}
          {source.readingDetail && (
            <p className="text-sm text-slate-600">Đã đọc: {source.readingDetail.replace(/^\((.*)\)$/, '$1')}</p>
          )}
          {source.population && <p className="text-sm text-slate-600">Làm trên ai: {source.population}</p>}
        </div>
      </div>
    </li>
  )
}

export function ResearchCardView({
  card,
  status,
  topics,
  sourceLabel,
}: {
  card: ResearchCard
  status?: CardStatus
  topics?: string[]
  sourceLabel?: string
}) {
  const titles = new Map(card.sources.map((s) => [s.n, s.title ?? `Nguồn ${s.n}`]))
  const cite: Cite = (text) => linkCitations(text, titles)
  const { meta } = card

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {status && <StatusBadge status={status} />}
          {meta.id && <span className="font-mono">{meta.id}</span>}
          {meta.version && <span>· bản {meta.version}</span>}
          {meta.checked && <span>· kiểm {meta.checked}</span>}
          {meta.model && <span>· {meta.model}</span>}
        </div>
        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{card.title ?? meta.id ?? 'Phiếu'}</h1>
        {meta.question && <p className="text-lg italic text-slate-700">{meta.question}</p>}
        {topics && topics.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          <LabelChip label="fact" />
          <LabelChip label="inference" />
          <LabelChip label="idea" />
          <span className="self-center text-slate-500">· [số] = bấm để xem nguồn</span>
        </div>
      </header>

      {card.intro && (
        <div className="prose prose-slate max-w-none">
          <Markdown>{cite(card.intro)}</Markdown>
        </div>
      )}

      {card.sections.map((section, i) => (
        <SectionBlock key={i} section={section} cite={cite} />
      ))}

      {card.sources.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold text-slate-900">Nguồn</h2>
          <ol className="space-y-3">
            {card.sources.map((s) => (
              <SourceItem key={s.n} source={s} />
            ))}
          </ol>
        </section>
      )}

      <footer className="border-t border-slate-200 pt-4 text-xs text-slate-400">
        {sourceLabel && <p>Nguồn dữ liệu: {sourceLabel}</p>}
        <p className="break-all">sha256 {card.sha256}</p>
      </footer>
    </div>
  )
}
