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
  onClose?: () => void
}

export function ProgressModal({
  isOpen,
  status,
  title,
  message,
  progress,
  error,
  onClose,
}: ProgressModalProps) {
  if (!isOpen) return null

  const canClose = status === 'completed' || status === 'failed'
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>

        <div className="p-6">
          {/* Status Icon */}
          <div className="mb-4 flex justify-center">
            {status === 'processing' && (
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
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
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {progress.current} / {progress.total}
                </span>
                <span className="font-medium text-slate-900">{percentage}%</span>
              </div>
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
        </div>
      </div>
    </div>
  )
}
