import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBlogCategories, addBlogCategory } from '@/lib/contentManager'

/**
 * GET - Fetch all blog categories
 */
export async function GET() {
  const categories = await getBlogCategories()
  return NextResponse.json({ success: true, categories })
}

/**
 * POST - Add new blog category (Admin only)
 */
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { category } = body

    if (!category || typeof category !== 'string' || !category.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    await addBlogCategory(category.trim())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding category:', error)
    return NextResponse.json(
      { error: 'Failed to add category' },
      { status: 500 }
    )
  }
}
