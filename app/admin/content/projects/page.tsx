'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Search, Loader2, Edit, Trash2, ExternalLink, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast, Toaster } from 'sonner'
import type { Project } from '@/lib/contentManager'

export default function ProjectsListPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState({ total: 0, draft: 0, published: 0, featured: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [filter])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content/projects?status=${filter}`)
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects)
        setStats(data.stats)
      } else {
        setProjects(data) // Backward compatibility
      }
    } catch (error) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return

    try {
      const res = await fetch(`/api/admin/content/projects/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Project deleted')
        fetchProjects()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.en.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.techStack?.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Toaster position="top-right" richColors />

      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-600 mt-1">Manage portfolio projects</p>
        </div>
        <Button onClick={() => router.push('/admin/content/projects/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-600">Total</p>
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-600">Published</p>
          <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-600">Draft</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-slate-600">Featured</p>
          <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 flex items-center gap-4">
        {/* Status Filter */}
        <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-1">
          {(['all', 'draft', 'published'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No projects found</p>
          <Button
            onClick={() => router.push('/admin/content/projects/new')}
            variant="outline"
            className="mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Tech Stack
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {project.featuredImage && (
                        <img
                          src={project.featuredImage}
                          alt={project.en.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{project.en.title}</p>
                        <p className="text-sm text-slate-500 truncate max-w-md">
                          {project.en.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {project.techStack?.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack && project.techStack.length > 3 && (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                          +{project.techStack.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          project.status === 'published'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {project.status}
                      </span>
                      {project.featured && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {project.status === 'published' && (
                        <button
                          onClick={() => window.open(`/projects/${project.slug}`, '_blank')}
                          className="p-2 text-slate-600 hover:text-primary-600 transition-colors"
                          title="View public page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/admin/content/projects/${project.id}`)}
                        className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id, project.en.title)}
                        className="p-2 text-slate-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
