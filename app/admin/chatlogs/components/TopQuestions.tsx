'use client'

import { MessageSquare, TrendingUp } from 'lucide-react'
import type { ChatLog } from '@/lib/chatLogger'
import { useMemo } from 'react'

interface TopQuestionsProps {
  logs: ChatLog[]
  limit?: number
}

interface QuestionFrequency {
  question: string
  count: number
  percentage: number
  examples: string[]
}

export function TopQuestions({ logs, limit = 10 }: TopQuestionsProps) {
  const topQuestions = useMemo(() => {
    // Group similar questions (normalize and count)
    const questionMap = new Map<string, { count: number; examples: Set<string> }>()

    logs.forEach((log) => {
      // Normalize question: lowercase, trim, remove trailing punctuation
      const normalized = log.userMessage
        .toLowerCase()
        .trim()
        .replace(/[?!.]+$/, '')
        .slice(0, 100) // Limit to first 100 chars for grouping

      if (questionMap.has(normalized)) {
        const entry = questionMap.get(normalized)!
        entry.count++
        if (entry.examples.size < 3) {
          entry.examples.add(log.userMessage)
        }
      } else {
        questionMap.set(normalized, {
          count: 1,
          examples: new Set([log.userMessage]),
        })
      }
    })

    // Convert to array and sort by frequency
    const totalQuestions = logs.length
    const questions: QuestionFrequency[] = Array.from(questionMap.entries())
      .map(([question, data]) => ({
        question,
        count: data.count,
        percentage: (data.count / totalQuestions) * 100,
        examples: Array.from(data.examples),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)

    return questions
  }, [logs, limit])

  if (topQuestions.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-bold text-slate-900">Top Questions</h2>
        <span className="text-sm text-slate-500">
          ({topQuestions.length} unique questions)
        </span>
      </div>

      <div className="space-y-3">
        {topQuestions.map((item, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 mb-1">
                      {item.examples[0]}
                    </p>
                    {item.examples.length > 1 && (
                      <details className="text-xs text-slate-500">
                        <summary className="cursor-pointer hover:text-primary-600">
                          +{item.examples.length - 1} similar question(s)
                        </summary>
                        <ul className="mt-2 ml-4 space-y-1">
                          {item.examples.slice(1).map((example, i) => (
                            <li key={i} className="list-disc">
                              {example}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  <span className="text-lg font-bold text-slate-900">{item.count}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {item.percentage.toFixed(1)}% of all chats
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t text-sm text-slate-600">
        <p>
          These {topQuestions.length} questions represent{' '}
          <span className="font-semibold">
            {topQuestions.reduce((sum, q) => sum + q.count, 0)} chats
          </span>{' '}
          ({topQuestions.reduce((sum, q) => sum + q.percentage, 0).toFixed(1)}% of total)
        </p>
      </div>
    </div>
  )
}
