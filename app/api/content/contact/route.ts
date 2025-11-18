import { NextResponse } from 'next/server'
import { getContactContent } from '@/lib/contentManager'

/**
 * GET - Fetch visible contact methods (public route)
 */
export async function GET() {
  const content = await getContactContent()

  // Filter only visible methods and sort by order
  const visibleMethods = content.methods
    .filter((m) => m.visible)
    .sort((a, b) => a.order - b.order)

  return NextResponse.json({ methods: visibleMethods })
}

export const revalidate = 60 // ISR: Revalidate every 60 seconds
