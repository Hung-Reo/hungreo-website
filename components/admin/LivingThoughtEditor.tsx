'use client'

import { AlertTriangle, History, Plus, Quote, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type {
  LivingThoughtContent,
  LivingThoughtSection,
  ThoughtEvolutionEntry,
  Uncertainty,
} from '@/lib/livingThought'

export interface LivingThoughtValue {
  status: 'draft' | 'published'
  occurredAt?: string
  structuredContent?: LivingThoughtContent
  thoughtEvolution?: ThoughtEvolutionEntry[]
  uncertainties?: Uncertainty[]
}

interface LivingThoughtEditorProps {
  value: LivingThoughtValue
  activeTab: 'en' | 'vi'
  onChange: (patch: Partial<LivingThoughtValue>) => void
}

const EMPTY_SECTION: LivingThoughtSection = { context: '', originalVoice: '', aiEditorial: '' }

const inputClass =
  'w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500'

export function LivingThoughtEditor({ value, activeTab, onChange }: LivingThoughtEditorProps) {
  const content: LivingThoughtContent = value.structuredContent || {
    en: EMPTY_SECTION,
    vi: EMPTY_SECTION,
  }
  const section = content[activeTab] || EMPTY_SECTION
  const evolution = value.thoughtEvolution || []
  const uncertainties = value.uncertainties || []
  const openCount = uncertainties.filter((u) => !u.resolved).length

  function updateSection(field: keyof LivingThoughtSection, text: string) {
    onChange({
      structuredContent: {
        ...content,
        [activeTab]: { ...section, [field]: text },
      },
    })
  }

  function updateEvolution(id: string, patch: Partial<ThoughtEvolutionEntry>) {
    onChange({ thoughtEvolution: evolution.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  }

  function updateUncertainty(id: string, patch: Partial<Uncertainty>) {
    onChange({ uncertainties: uncertainties.map((u) => (u.id === id ? { ...u, ...patch } : u)) })
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Living Thought</h3>
        <p className="text-sm text-slate-600 mt-1">
          Keep Hung&apos;s own words verbatim and AI notes apart. Leave empty for a normal post.
          Do not put a child&apos;s name, photo, school or other identifying details here.
        </p>
      </div>

      {openCount > 0 && value.status === 'published' && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {openCount} uncertainty item(s) still open. Saving as Published will be rejected until
            each one is resolved.
          </span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Occurred on (when it happened)
        </label>
        <input
          type="date"
          value={value.occurredAt || ''}
          // Send '' (not undefined) when cleared: JSON drops undefined keys and the
          // PUT route would then keep the stored date.
          onChange={(e) => onChange({ occurredAt: e.target.value })}
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {activeTab === 'en' ? 'English' : 'Tiếng Việt'} — switch language with the tabs above
        </p>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {activeTab === 'en' ? 'Context' : 'Bối cảnh'}
          </label>
          <textarea
            value={section.context}
            onChange={(e) => updateSection('context', e.target.value)}
            rows={2}
            className={inputClass}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Quote className="h-4 w-4" />
            {activeTab === 'en' ? "Hung's own words (verbatim)" : 'Lời gốc của Hưng (nguyên văn)'}
          </label>
          <textarea
            value={section.originalVoice}
            onChange={(e) => updateSection('originalVoice', e.target.value)}
            rows={5}
            className={inputClass}
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
            <Sparkles className="h-4 w-4" />
            {activeTab === 'en'
              ? 'AI editorial notes (Markdown; shown apart, not indexed for the chatbot)'
              : 'Ghi chú AI biên tập (Markdown; hiển thị tách riêng, không đưa vào chatbot)'}
          </label>
          <textarea
            value={section.aiEditorial}
            onChange={(e) => updateSection('aiEditorial', e.target.value)}
            rows={4}
            className={`${inputClass} font-mono text-sm`}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-medium text-slate-800">
            <History className="h-4 w-4" />
            Thought evolution (public)
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                thoughtEvolution: [
                  ...evolution,
                  { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), noteVi: '', noteEn: '' },
                ],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        {evolution.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={entry.date}
                onChange={(e) => updateEvolution(entry.id, { date: e.target.value })}
                className="border rounded-lg px-3 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange({ thoughtEvolution: evolution.filter((e) => e.id !== entry.id) })}
                className="ml-auto text-slate-400 hover:text-red-600"
                aria-label="Remove entry"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={entry.noteVi}
              onChange={(e) => updateEvolution(entry.id, { noteVi: e.target.value })}
              placeholder="Ghi chú (VI)"
              rows={2}
              className={`${inputClass} text-sm`}
            />
            <textarea
              value={entry.noteEn}
              onChange={(e) => updateEvolution(entry.id, { noteEn: e.target.value })}
              placeholder="Note (EN)"
              rows={2}
              className={`${inputClass} text-sm`}
            />
          </div>
        ))}
        <p className="text-xs text-slate-500">Entries need a date and at least one note to be saved.</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-2 font-medium text-slate-800">
            <AlertTriangle className="h-4 w-4" />
            Uncertainties (admin only, never public)
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onChange({
                uncertainties: [
                  ...uncertainties,
                  { id: crypto.randomUUID(), question: '', resolved: false },
                ],
              })
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        {uncertainties.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={item.resolved}
                onChange={(e) => updateUncertainty(item.id, { resolved: e.target.checked })}
                className="mt-2"
                aria-label="Resolved"
              />
              <textarea
                value={item.question}
                onChange={(e) => updateUncertainty(item.id, { question: e.target.value })}
                placeholder="What is unclear in the original words?"
                rows={2}
                className={`${inputClass} text-sm`}
              />
              <button
                type="button"
                onClick={() => onChange({ uncertainties: uncertainties.filter((u) => u.id !== item.id) })}
                className="mt-2 text-slate-400 hover:text-red-600"
                aria-label="Remove item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={item.resolutionNote || ''}
              onChange={(e) => updateUncertainty(item.id, { resolutionNote: e.target.value })}
              placeholder="Resolution note (optional)"
              className={`${inputClass} text-sm`}
            />
          </div>
        ))}
        <p className="text-xs text-slate-500">
          Tick an item once Hung confirms it. Empty questions are dropped on save.
        </p>
      </div>
    </div>
  )
}
