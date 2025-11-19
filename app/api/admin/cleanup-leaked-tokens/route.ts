import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { auth } from '@/lib/auth'

/**
 * SECURITY: One-time cleanup script to purge chat logs containing leaked reset tokens
 * This endpoint should be called once after deploying the pathname sanitization fix
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth()
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let scanned = 0
    let deleted = 0
    const deletedKeys: string[] = []

    // Scan all chat:* keys in KV
    const keys = await kv.keys('chat:*')

    for (const key of keys) {
      scanned++
      const data = await kv.get(key) as any

      // Check if this chat log contains a reset-password token in the pathname
      if (data?.pageContext?.page?.includes('/admin/reset-password/') &&
          !data.pageContext.page.includes('[token]')) { // Already sanitized logs are OK
        // Delete this potentially leaked chat log
        await kv.del(key)
        deleted++
        deletedKeys.push(key as string)

        // Also remove from date-based lists
        const timestamp = data.timestamp || Date.now()
        const date = new Date(timestamp).toISOString().split('T')[0]
        const dateKey = `chats:${date}`
        const chatIds = (await kv.lrange(dateKey, 0, -1)) || []
        const filteredIds = chatIds.filter((id) => `chat:${id}` !== key)

        // Rebuild the date list without the leaked chat
        if (filteredIds.length !== chatIds.length) {
          await kv.del(dateKey)
          if (filteredIds.length > 0) {
            await kv.lpush(dateKey, ...filteredIds)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup complete. Scanned ${scanned} chat logs, deleted ${deleted} logs containing leaked tokens.`,
      scanned,
      deleted,
      deletedKeys: deletedKeys.slice(0, 10), // Return first 10 for verification
    })
  } catch (error) {
    console.error('[Cleanup Leaked Tokens] Error:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup leaked tokens' },
      { status: 500 }
    )
  }
}
