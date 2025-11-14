import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllProjects,
  getPublishedProjects,
  saveProject,
  generateSlug,
  generateId,
  Project,
} from '@/lib/contentManager'

/**
 * GET - List all projects (with optional status filter)
 * Query params: status = 'all' | 'published' | 'draft'
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'all'

  let projects: Project[] = []

  if (status === 'published') {
    projects = await getPublishedProjects()
  } else {
    projects = await getAllProjects()

    if (status === 'draft') {
      projects = projects.filter(p => p.status === 'draft')
    }
  }

  return NextResponse.json(projects)
}

/**
 * POST - Create new project (Admin only)
 */
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.en?.title || !body.en?.description) {
      return NextResponse.json(
        { error: 'Missing required English fields (title, description)' },
        { status: 400 }
      )
    }

    // Generate slug from title if not provided
    const slug = body.slug || generateSlug(body.en.title)

    const project: Project = {
      id: generateId(),
      slug,
      status: body.status || 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: session.user.email || 'admin',
      en: {
        title: body.en.title,
        description: body.en.description,
        content: body.en.content || '',
      },
      vi: body.vi || {
        title: '',
        description: '',
        content: '',
      },
      tech: body.tech || [],
      image: body.image,
      github: body.github,
      demo: body.demo,
      featured: body.featured || false,
    }

    await saveProject(project)

    return NextResponse.json(
      { success: true, project },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
