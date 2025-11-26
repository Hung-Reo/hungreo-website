import { useEffect, useRef, useState } from 'react'

export interface JobProgress {
  current: number
  total: number
  message: string
}

export interface JobStatus {
  id: string
  type: 'document-approval' | 'website-scrape' | 'selective-rescrape'
  status: 'processing' | 'completed' | 'failed'
  progress: JobProgress
  result?: any
  error?: string
  startedAt: number
  completedAt?: number
}

interface UseJobPollingOptions {
  jobId: string | null
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  interval?: number // Polling interval in ms (default: 1000)
  enabled?: boolean
}

export function useJobPolling({
  jobId,
  onComplete,
  onError,
  interval = 1000,
  enabled = true,
}: UseJobPollingOptions) {
  const [job, setJob] = useState<JobStatus | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!jobId || !enabled) {
      return
    }

    setIsPolling(true)
    completedRef.current = false

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/admin/jobs/${jobId}`)
        const data = await response.json()

        if (data.success && data.job) {
          setJob(data.job)

          if (data.job.status === 'completed' && !completedRef.current) {
            completedRef.current = true
            setIsPolling(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            onComplete?.(data.job.result)
          } else if (data.job.status === 'failed' && !completedRef.current) {
            completedRef.current = true
            setIsPolling(false)
            if (intervalRef.current) {
              clearInterval(intervalRef.current)
              intervalRef.current = null
            }
            onError?.(data.job.error || 'Job failed')
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error)
      }
    }

    // Poll immediately
    pollJob()

    // Then poll at interval
    intervalRef.current = setInterval(pollJob, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId, enabled, interval, onComplete, onError])

  const reset = () => {
    setJob(null)
    setIsPolling(false)
    completedRef.current = false
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return {
    job,
    isPolling,
    reset,
  }
}
