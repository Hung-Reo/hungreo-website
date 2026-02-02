'use client'

import type { VisitorStats } from '@/lib/visitorTracker'

interface VisitorStatsModalProps {
  isOpen: boolean
  onClose: () => void
  stats: VisitorStats | null
}

export function VisitorStatsModal({ isOpen, onClose, stats }: VisitorStatsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">Visitor Statistics</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm text-slate-600">Today</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.today || 0}</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm text-slate-600">This Week</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.thisWeek || 0}</p>
            </div>
            <div className="rounded-lg border bg-slate-50 p-4">
              <p className="text-sm text-slate-600">This Month</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{stats?.thisMonth || 0}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Top Pages</h3>
              {stats?.topPages?.length ? (
                <div className="space-y-2">
                  {stats.topPages.map((page) => (
                    <div key={page.page} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <span className="text-sm text-slate-700">{page.page}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {page.views}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No page data yet</p>
              )}
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Devices</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-2">
                  <span className="text-sm text-slate-700">Desktop</span>
                  <span className="text-sm font-medium text-slate-900">{stats?.devices?.desktop || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-4 py-2">
                  <span className="text-sm text-slate-700">Mobile</span>
                  <span className="text-sm font-medium text-slate-900">{stats?.devices?.mobile || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
