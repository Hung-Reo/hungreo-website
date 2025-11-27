import { kv } from '@vercel/kv'

export interface JobStatus {
  id: string
  type: 'document-approval' | 'document-upload' | 'website-scrape' | 'selective-rescrape' | 'video-import' | 'video-embedding'
  status: 'processing' | 'completed' | 'failed'
  progress: {
    current: number
    total: number
    message: string
  }
  result?: any
  error?: string
  startedAt: number
  completedAt?: number
  lastUpdated?: number
  logs?: Array<{
    timestamp: number
    level: 'info' | 'warn' | 'error'
    message: string
  }>
}

// Extend TTL to allow longer-running tasks and SSE consumption
const JOB_TTL_SECONDS = 60 * 60 // 1 hour

export async function createJob(
  id: string,
  type: JobStatus['type'],
  total: number
): Promise<void> {
  const job: JobStatus = {
    id,
    type,
    status: 'processing',
    progress: {
      current: 0,
      total,
      message: 'Starting...',
    },
    startedAt: Date.now(),
    lastUpdated: Date.now(),
    logs: [],
  }
  await kv.set(`job:${id}`, job, { ex: JOB_TTL_SECONDS })
}

export async function updateJobProgress(
  id: string,
  current: number,
  message: string
): Promise<void> {
  const job = await kv.get<JobStatus>(`job:${id}`)
  if (!job) return

  job.progress.current = current
  job.progress.message = message
  job.lastUpdated = Date.now()
  await kv.set(`job:${id}`, job, { ex: JOB_TTL_SECONDS })
}

export async function completeJob(
  id: string,
  result?: any
): Promise<void> {
  const job = await kv.get<JobStatus>(`job:${id}`)
  if (!job) return

  job.status = 'completed'
  job.progress.current = job.progress.total
  job.progress.message = 'Completed successfully'
  job.completedAt = Date.now()
  job.result = result
  job.lastUpdated = Date.now()
  await kv.set(`job:${id}`, job, { ex: JOB_TTL_SECONDS })
}

export async function failJob(
  id: string,
  error: string
): Promise<void> {
  const job = await kv.get<JobStatus>(`job:${id}`)
  if (!job) return

  job.status = 'failed'
  job.progress.message = 'Failed'
  job.error = error
  job.completedAt = Date.now()
  job.lastUpdated = Date.now()
  await kv.set(`job:${id}`, job, { ex: JOB_TTL_SECONDS })
}

export async function getJobStatus(id: string): Promise<JobStatus | null> {
  return await kv.get<JobStatus>(`job:${id}`)
}

export async function deleteJob(id: string): Promise<void> {
  await kv.del(`job:${id}`)
}

/**
 * Emit a progress update with optional total override
 */
export async function emitProgress(
  id: string,
  message: string,
  current: number,
  total?: number
): Promise<void> {
  const job = await kv.get<JobStatus>(`job:${id}`)
  if (!job) return

  job.progress.current = current
  job.progress.message = message
  if (typeof total === 'number') {
    job.progress.total = total
  }
  job.lastUpdated = Date.now()

  await kv.set(`job:${id}`, job, { ex: JOB_TTL_SECONDS })
}

/**
 * Append a log entry to a job (keeps last 50 entries)
 */
export async function appendLog(
  id: string,
  level: 'info' | 'warn' | 'error',
  message: string
): Promise<void> {
  const job = await kv.get<JobStatus>(`job:${id}`)
  if (!job) return

  const logs = job.logs ?? []
  logs.push({
    timestamp: Date.now(),
    level,
    message,
  })

  // Keep only last 50 logs to control size
  const trimmed = logs.slice(-50)
  job.logs = trimmed
  job.lastUpdated = Date.now()

  await kv.set(`job:${id}`, job, { ex: JOB_TTL_SECONDS })
}
