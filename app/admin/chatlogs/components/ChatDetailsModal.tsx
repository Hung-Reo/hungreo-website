'use client'

import { X, Calendar, MapPin, MessageSquare, CheckCircle, AlertCircle, Copy } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { ChatLog } from '@/lib/chatLogger'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatDetailsModalProps {
  log: ChatLog | null
  isOpen: boolean
  onClose: () => void
  onMarkReplied: (chatId: string) => Promise<void>
}

export function ChatDetailsModal({ log, isOpen, onClose, onMarkReplied }: ChatDetailsModalProps) {
  const [isMarking, setIsMarking] = useState(false)
  const [copied, setCopied] = useState<'user' | 'assistant' | null>(null)

  if (!isOpen || !log) return null

  const handleMarkReplied = async () => {
    setIsMarking(true)
    try {
      await onMarkReplied(log.id)
      // Close modal after marking
      setTimeout(() => {
        onClose()
      }, 500)
    } finally {
      setIsMarking(false)
    }
  }

  const copyToClipboard = (text: string, type: 'user' | 'assistant') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const date = new Date(log.timestamp)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-slate-900">Chat Details</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-medium text-slate-700">Timestamp</div>
                  <div className="text-slate-600">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-medium text-slate-700">Page Context</div>
                  <div className="text-slate-600">{log.pageContext?.page || 'N/A'}</div>
                  {log.pageContext?.videoId && (
                    <div className="text-xs text-slate-500">Video: {log.pageContext.videoId}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <div>
                  <div className="font-medium text-slate-700">Status</div>
                  <div>
                    {log.needsHumanReply ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        <AlertCircle className="h-3 w-3" />
                        Needs Reply
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        Replied
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* User Message */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  User Message
                </h3>
                <button
                  onClick={() => copyToClipboard(log.userMessage, 'user')}
                  className="text-xs text-slate-600 hover:text-primary-600 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  {copied === 'user' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-slate-900 whitespace-pre-wrap">{log.userMessage}</p>
              </div>
            </div>

            {/* Assistant Response */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  Assistant Response
                </h3>
                <button
                  onClick={() => copyToClipboard(log.assistantResponse, 'assistant')}
                  className="text-xs text-slate-600 hover:text-primary-600 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  {copied === 'assistant' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm as any]}
                    components={{
                      p: ({ children }) => <p className="my-2 leading-relaxed text-slate-900">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                      ul: ({ children }) => <ul className="my-2 ml-5 space-y-1 list-disc">{children}</ul>,
                      ol: ({ children }) => <ol className="my-2 ml-5 space-y-1 list-decimal">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed text-slate-900">{children}</li>,
                      h3: ({ children }) => <h3 className="font-semibold text-base mt-3 mb-2 text-slate-900">{children}</h3>,
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 underline font-medium"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {log.assistantResponse}
                  </ReactMarkdown>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {log.needsHumanReply && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  This chat requires human attention. The AI may not have been able to answer the question adequately.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-slate-50">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {log.needsHumanReply && (
              <Button
                onClick={handleMarkReplied}
                disabled={isMarking}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {isMarking ? 'Marking...' : 'Mark as Replied'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
