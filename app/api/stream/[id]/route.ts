import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { getJobStatus } from '@/lib/jobTracker'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JOB_APPEAR_TIMEOUT_MS = 30_000

/**
 * Server-Sent Events stream for job progress
 * GET /api/stream/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'admin') {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = await params

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let heartbeat: NodeJS.Timeout | null = null
      let pollTimer: NodeJS.Timeout | null = null
      let closed = false

      const stopTimers = () => {
        if (heartbeat) clearInterval(heartbeat)
        if (pollTimer) clearInterval(pollTimer)
      }

      const sendEvent = (payload: any) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {
          // Controller already closed: stop polling KV for a client that is gone
          closed = true
          stopTimers()
        }
      }

      const close = () => {
        stopTimers()
        if (closed) return
        closed = true
        try {
          controller.close()
        } catch {
          // Already closed by the runtime
        }
      }

      // Heartbeat to keep connection alive
      heartbeat = setInterval(() => {
        sendEvent({ type: 'heartbeat' })
      }, 15000)

      // The browser opens this stream before it sends the request that creates
      // the job, so give the job a short grace period to appear.
      const startedAt = Date.now()

      // Poll job status periodically
      const poll = async () => {
        try {
          const job = await getJobStatus(id)

          if (!job) {
            if (Date.now() - startedAt < JOB_APPEAR_TIMEOUT_MS) {
              sendEvent({ type: 'waiting' })
              return
            }
            sendEvent({ type: 'error', message: 'Job not found' })
            return close()
          }

          // Always stream latest job snapshot
          sendEvent({
            type: job.status === 'processing' ? 'progress' : job.status,
            job,
          })

          if (job.status === 'completed' || job.status === 'failed') {
            return close()
          }
        } catch (error: any) {
          sendEvent({
            type: 'error',
            message: error?.message || 'Failed to fetch job status',
          })
          return close()
        }
      }

      // Initial poll immediately
      await poll()

      // Continue polling every second (unless the first poll already finished the stream)
      if (!closed) pollTimer = setInterval(poll, 1000)

      // Handle client disconnect
      req.signal.addEventListener('abort', () => close())
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
