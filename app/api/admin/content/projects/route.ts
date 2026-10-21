import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getAllProjects,
  getPublishedProjects,
  saveProject,
  generateSlug,
  generateId,
  Project,
  getProjectSlugOwner,
} from '@/lib/contentManager'
import { findAvailableSlug } from '@/lib/slug'
import { syncContentIndex } from '@/lib/contentIndex'

// Creating a published project also indexes it for the chatbot (lib/contentIndex.ts)
export const maxDuration = 60

/**
 * GET - List all projects (with optional status filter)
 * Query params: status = 'all' | 'published' | 'draft'
 */
export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

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

  // Sort by updatedAt (newest first)
  projects.sort((a, b) => b.updatedAt - a.updatedAt)

  // Calculate stats
  const allProjects = status !== 'all' ? await getAllProjects() : projects
  const stats = {
    total: allProjects.length,
    draft: allProjects.filter(p => p.status === 'draft').length,
    published: allProjects.filter(p => p.status === 'published').length,
    featured: allProjects.filter(p => p.featured).length
  }

  return NextResponse.json({
    success: true,
    projects,
    stats
  })
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

    // Generate slug from title if not provided; never take another project's slug
    const id = generateId()
    const slug = await findAvailableSlug(body.slug || generateSlug(body.en.title), id, getProjectSlugOwner)

    const now = Date.now()
    const project: Project = {
      id,
      slug,
      status: body.status || 'draft',
      featured: body.featured || false,
      createdAt: now,
      updatedAt: now,
      publishedAt: body.status === 'published' ? now : undefined,
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
      techStack: body.techStack || body.tech || [],
      learnings: body.learnings || [],
      githubUrl: body.githubUrl || body.github,
      demoUrl: body.demoUrl || body.demo,
      featuredImage: body.featuredImage || body.image,
      screenshots: body.screenshots || [],
      source: body.source,
    }

    await saveProject(project)
    const index = await syncContentIndex('projects', null, project)

    return NextResponse.json(
      { success: true, project, index },
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
