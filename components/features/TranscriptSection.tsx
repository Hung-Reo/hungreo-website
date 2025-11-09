'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'

interface TranscriptSectionProps {
  transcript: string
}

export function TranscriptSection({ transcript }: TranscriptSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Show first 500 characters when collapsed
  const previewText = transcript.substring(0, 500)
  const shouldTruncate = transcript.length > 500

  return (
    <div className="mt-8">
      <div className="rounded-lg border border-slate-200 bg-white">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between p-4 text-left hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-600" />
            <span className="font-semibold text-slate-900">Transcript</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-600" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="border-t border-slate-200 p-4">
            <div className="max-h-96 overflow-y-auto rounded bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {transcript}
              </p>
            </div>
          </div>
        )}

        {!isExpanded && shouldTruncate && (
          <div className="border-t border-slate-200 px-4 pb-4 pt-2">
            <p className="text-sm text-slate-600">
              {previewText}...
            </p>
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Show full transcript
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
