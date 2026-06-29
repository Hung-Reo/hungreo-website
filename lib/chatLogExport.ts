import type { ChatLog } from './chatLogger'

type ExportableChatLog = Pick<
  ChatLog,
  | 'id'
  | 'timestamp'
  | 'userMessage'
  | 'assistantResponse'
  | 'pageContext'
  | 'relevantDocs'
  | 'responseTime'
  | 'needsHumanReply'
>

const FORMULA_PREFIX = /^[=+\-@\t\r]/

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''

  const raw = String(value)
  const safe = FORMULA_PREFIX.test(raw) ? `'${raw}` : raw

  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`
  }

  return safe
}

export function convertChatLogsToCSV(logs: ExportableChatLog[]): string {
  if (logs.length === 0) {
    return 'No data available'
  }

  const headers = [
    'ID',
    'Timestamp',
    'Date',
    'Time',
    'User Message',
    'Assistant Response',
    'Page Context',
    'Video ID',
    'Relevant Docs',
    'Response Time (ms)',
    'Needs Reply',
  ]

  const rows = logs.map(log => {
    const date = new Date(log.timestamp)
    return [
      log.id,
      log.timestamp,
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      log.userMessage,
      log.assistantResponse,
      log.pageContext?.page || '',
      log.pageContext?.videoId || '',
      log.relevantDocs || 0,
      log.responseTime || 0,
      log.needsHumanReply ? 'YES' : 'NO',
    ].map(escapeCsvCell).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}
