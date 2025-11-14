import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getProject,
  saveProject,
  deleteProject,
  generateSlug,
} from '@/lib/contentManager'

/**
 * GET - Fetch single project by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project = await getProject(params.id)

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(project)
}

/**
 * PUT - Update project (Admin only)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const existing = await getProject(params.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.en?.title || !body.en?.description) {
      return NextResponse.json(
        { error: 'Missing required English fields (title, description)' },
        { status: 400 }
      )
    }

    // Update slug if title changed
    const slug = body.slug || (
      body.en.title !== existing.en.title
        ? generateSlug(body.en.title)
        : existing.slug
    )

    const project = {
      ...existing,
      ...body,
      id: params.id, // Ensure ID doesn't change
      slug,
      updatedAt: Date.now(),
    }

    await saveProject(project)

    return NextResponse.json({ success: true, project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete project (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await deleteProject(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
