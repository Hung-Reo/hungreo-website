'use client'

import { MessageSquare, TrendingUp, Calendar, Clock, AlertCircle } from 'lucide-react'

interface ChatLogsStatsProps {
  stats: {
    totalChats: number
    chatsToday: number
    chatsThisWeek: number
    chatsThisMonth: number
    needsReply: number
  }
}

export function ChatLogsStats({ stats }: ChatLogsStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Chats */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Chats</p>
            <p className="text-2xl font-bold mt-1">{stats.totalChats.toLocaleString()}</p>
          </div>
          <MessageSquare className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Today */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Today</p>
            <p className="text-2xl font-bold mt-1">{stats.chatsToday.toLocaleString()}</p>
          </div>
          <Clock className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* This Week */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">This Week</p>
            <p className="text-2xl font-bold mt-1">{stats.chatsThisWeek.toLocaleString()}</p>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-600" />
        </div>
      </div>

      {/* This Month */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">This Month</p>
            <p className="text-2xl font-bold mt-1">{stats.chatsThisMonth.toLocaleString()}</p>
          </div>
          <Calendar className="h-8 w-8 text-orange-600" />
        </div>
      </div>

      {/* Needs Reply */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Needs Reply</p>
            <p className="text-2xl font-bold mt-1">{stats.needsReply.toLocaleString()}</p>
          </div>
          <AlertCircle className={`h-8 w-8 ${stats.needsReply > 0 ? 'text-red-600' : 'text-slate-400'}`} />
        </div>
      </div>
    </div>
  )
}
