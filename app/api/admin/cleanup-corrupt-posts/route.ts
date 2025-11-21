import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAllBlogPosts, deleteBlogPost } from '@/lib/contentManager'

/**
 * GET - List all corrupt blog posts (posts without titles)
 */
export async function GET() {
  try {
    const allPosts = await getAllBlogPosts()

    // Find corrupt posts (without title)
    const corruptPosts = allPosts.filter(p => !p.en?.title)

    return NextResponse.json({
      success: true,
      count: corruptPosts.length,
      posts: corruptPosts.map(p => ({
        id: p.id,
        slug: p.slug || 'no-slug',
        status: p.status,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        hasEnTitle: !!p.en?.title,
        hasViTitle: !!p.vi?.title,
        enContent: p.en?.content?.substring(0, 100) || '',
        viContent: p.vi?.content?.substring(0, 100) || '',
      })),
    })
  } catch (error) {
    console.error('Error fetching corrupt posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch corrupt posts' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove all corrupt blog posts
 */
export async function DELETE(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const allPosts = await getAllBlogPosts()

    // Find corrupt posts (without title)
    const corruptPosts = allPosts.filter(p => !p.en?.title)

    // Delete all corrupt posts
    const deletePromises = corruptPosts.map(p => deleteBlogPost(p.id))
    await Promise.all(deletePromises)

    return NextResponse.json({
      success: true,
      message: `Deleted ${corruptPosts.length} corrupt post(s)`,
      deletedCount: corruptPosts.length,
      deletedIds: corruptPosts.map(p => p.id),
    })
  } catch (error) {
    console.error('Error deleting corrupt posts:', error)
    return NextResponse.json(
      { error: 'Failed to delete corrupt posts' },
      { status: 500 }
    )
  }
}
