'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { ChatLog } from '@/lib/chatLogger'

interface ChatLogsChartProps {
  logs: ChatLog[]
}

interface ChartData {
  date: string
  total: number
  needsReply: number
  replied: number
}

export function ChatLogsChart({ logs }: ChatLogsChartProps) {
  const chartData = useMemo(() => {
    // Group logs by date
    const dateMap = new Map<string, { total: number; needsReply: number; replied: number }>()

    logs.forEach((log) => {
      const date = new Date(log.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })

      if (!dateMap.has(date)) {
        dateMap.set(date, { total: 0, needsReply: 0, replied: 0 })
      }

      const entry = dateMap.get(date)!
      entry.total++
      if (log.needsHumanReply) {
        entry.needsReply++
      } else {
        entry.replied++
      }
    })

    // Convert to array and sort by date
    const data: ChartData[] = Array.from(dateMap.entries())
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => {
        // Sort by date (parse and compare)
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })

    return data
  }, [logs])

  if (chartData.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-bold text-slate-900">Chat Volume Trends</h2>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              cursor={{ fill: '#f1f5f9' }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
            <Bar
              dataKey="replied"
              name="Replied"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
            <Bar
              dataKey="needsReply"
              name="Needs Reply"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              stackId="stack"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-slate-600">Total Chats in Period</p>
          <p className="text-2xl font-bold text-slate-900">
            {chartData.reduce((sum, day) => sum + day.total, 0)}
          </p>
        </div>
        <div>
          <p className="text-slate-600">Average per Day</p>
          <p className="text-2xl font-bold text-slate-900">
            {(chartData.reduce((sum, day) => sum + day.total, 0) / chartData.length).toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-slate-600">Peak Day</p>
          <p className="text-2xl font-bold text-slate-900">
            {chartData.reduce((max, day) => (day.total > max.total ? day : max), chartData[0])
              ?.date || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  )
}
