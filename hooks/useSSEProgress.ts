import { useEffect, useRef, useState } from 'react'
import type { JobStatus } from '@/lib/jobTracker'

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed'

interface UseSSEProgressOptions {
  jobId: string | null
  enabled?: boolean
  onComplete?: (job: JobStatus) => void
  onError?: (error: string) => void
}

interface SSEMessage {
  type: 'progress' | 'completed' | 'failed' | 'error' | 'heartbeat'
  job?: JobStatus
  message?: string
}

export function useSSEProgress({
  jobId,
  enabled = true,
  onComplete,
  onError,
}: UseSSEProgressOptions) {
  const [job, setJob] = useState<JobStatus | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(true)

  useEffect(() => {
    if (!jobId || !enabled) {
      setJob(null)
      setConnectionState('idle')
      setError(null)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    shouldReconnectRef.current = true

    const connect = () => {
      if (!jobId) return

      // Clear any pending reconnect timer
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }

      setConnectionState('connecting')
      setError(null)

      const es = new EventSource(`/api/stream/${jobId}`)
      eventSourceRef.current = es

      es.onopen = () => {
        setConnectionState('connected')
      }

      es.onerror = () => {
        setConnectionState('error')
        if (shouldReconnectRef.current) {
          // Retry after short delay
          reconnectTimerRef.current = setTimeout(connect, 1500)
        }
      }

      es.onmessage = (event: MessageEvent) => {
        try {
          const payload: SSEMessage = JSON.parse(event.data)

          if (payload.type === 'heartbeat') {
            return
          }

          if (payload.type === 'error') {
            const msg = payload.message || 'Job stream error'
            setError(msg)
            setConnectionState('error')
            shouldReconnectRef.current = false
            onError?.(msg)
            es.close()
            return
          }

          if (payload.job) {
            setJob(payload.job)
          }

          if (payload.type === 'completed' && payload.job) {
            shouldReconnectRef.current = false
            setConnectionState('closed')
            onComplete?.(payload.job)
            es.close()
            return
          }

          if (payload.type === 'failed') {
            shouldReconnectRef.current = false
            setConnectionState('closed')
            const msg =
              payload.job?.error || payload.message || 'Job failed'
            setError(msg)
            onError?.(msg)
            es.close()
          }
        } catch (err: any) {
          const msg = err?.message || 'Failed to parse stream message'
          setError(msg)
        }
      }
    }

    connect()

    return () => {
      shouldReconnectRef.current = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
    }
  }, [jobId, enabled, onComplete, onError])

  return {
    job,
    connectionState,
    error,
  }
}
