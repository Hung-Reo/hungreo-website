import { kv } from '@vercel/kv'

export interface JobStatus {
  id: string
  type: 'document-approval' | 'website-scrape' | 'selective-rescrape'
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
}

const JOB_TTL = 600 // 10 minutes

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
  }
  await kv.set(`job:${id}`, job, { ex: JOB_TTL })
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
  await kv.set(`job:${id}`, job, { ex: JOB_TTL })
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
  await kv.set(`job:${id}`, job, { ex: JOB_TTL })
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
  await kv.set(`job:${id}`, job, { ex: JOB_TTL })
}

export async function getJobStatus(id: string): Promise<JobStatus | null> {
  return await kv.get<JobStatus>(`job:${id}`)
}

export async function deleteJob(id: string): Promise<void> {
  await kv.del(`job:${id}`)
}
