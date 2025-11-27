import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface ProgressModalProps {
  isOpen: boolean
  status: 'processing' | 'completed' | 'failed'
  title: string
  message: string
  progress?: {
    current: number
    total: number
  }
  error?: string
  logs?: Array<{
    timestamp: number
    level?: string
    message: string
  }>
  connectionState?: 'idle' | 'connecting' | 'connected' | 'error' | 'closed'
  onClose?: () => void
}

export function ProgressModal({
  isOpen,
  status,
  title,
  message,
  progress,
  error,
  logs,
  connectionState,
  onClose,
}: ProgressModalProps) {
  if (!isOpen) return null

  const canClose = status === 'completed' || status === 'failed'
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0
  const visibleLogs = logs ? logs.slice(-5).reverse() : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>

        <div className="p-6">
          {/* Status Icon with Percentage */}
          <div className="mb-4 flex flex-col items-center justify-center gap-3">
            {status === 'processing' && (
              <>
                {/* Large Percentage Display */}
                {progress && (
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600">
                      {percentage}%
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {progress.current} of {progress.total} completed
                    </div>
                  </div>
                )}
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </>
            )}
            {status === 'completed' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === 'failed' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>

          {/* Message */}
          <p className="mb-4 text-center text-slate-700">{message}</p>

          {/* Progress Bar */}
          {status === 'processing' && progress && (
            <div className="mb-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'failed' && error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Live Logs */}
          {visibleLogs.length > 0 && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Live updates
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                {visibleLogs.map((log) => (
                  <div key={log.timestamp} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="flex-1">
                      {log.level ? `[${log.level}] ` : ''}
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Close
            </button>
          )}

          {/* Processing Message */}
          {status === 'processing' && (
            <p className="text-center text-sm text-slate-500">
              Please wait, this may take a moment...
            </p>
          )}

          {connectionState && (
            <p className="mt-2 text-center text-[11px] uppercase tracking-wide text-slate-400">
              {connectionState}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
