'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../ui/Button'

interface VectorStats {
  website: number
  document: number
  video: number
  unknown: number
  total: number
}

export function VectorManager() {
  const [stats, setStats] = useState<VectorStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch vector statistics
  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/vectors/stats')
      const data = await res.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete vectors by type
  const deleteByType = async (type: 'website' | 'document' | 'video' | 'all') => {
    const confirmMessage =
      type === 'all'
        ? 'Are you ABSOLUTELY SURE you want to delete ALL vectors? This cannot be undone!'
        : `Delete all ${type} vectors? This cannot be undone!`

    if (!confirm(confirmMessage)) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/admin/vectors?type=${type}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        alert(data.message)
        await fetchStats()
      } else {
        alert('Delete failed: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to delete vectors:', error)
      alert('Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vector Database Management</h1>
          <p className="text-gray-600 mt-2">Manage Pinecone vectors for RAG chatbot</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Vectors</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
          </div>

          <Link href="/admin/vectors/website">
            <div className="bg-blue-50 p-6 rounded-lg shadow cursor-pointer hover:bg-blue-100">
              <h3 className="text-sm font-medium text-blue-600">Website Vectors</h3>
              <p className="text-3xl font-bold text-blue-900 mt-2">{stats?.website || 0}</p>
              <button className="text-xs text-blue-600 mt-2">View Details →</button>
            </div>
          </Link>

          <Link href="/admin/vectors/documents">
            <div className="bg-green-50 p-6 rounded-lg shadow cursor-pointer hover:bg-green-100">
              <h3 className="text-sm font-medium text-green-600">Document Vectors</h3>
              <p className="text-3xl font-bold text-green-900 mt-2">{stats?.document || 0}</p>
              <button className="text-xs text-green-600 mt-2">View Details →</button>
            </div>
          </Link>

          <Link href="/admin/videos">
            <div className="bg-purple-50 p-6 rounded-lg shadow cursor-pointer hover:bg-purple-100">
              <h3 className="text-sm font-medium text-purple-600">Video Vectors</h3>
              <p className="text-3xl font-bold text-purple-900 mt-2">{stats?.video || 0}</p>
              <button className="text-xs text-purple-600 mt-2">View Details →</button>
            </div>
          </Link>

          <div className="bg-gray-50 p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Unknown Type</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.unknown || 0}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => deleteByType('website')}
              disabled={deleteLoading || (stats?.website || 0) === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Delete All Website
            </button>

            <button
              onClick={() => deleteByType('document')}
              disabled={deleteLoading || (stats?.document || 0) === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Delete All Documents
            </button>

            <button
              onClick={() => deleteByType('video')}
              disabled={deleteLoading || (stats?.video || 0) === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Delete All Videos
            </button>

            <button
              onClick={() => deleteByType('all')}
              disabled={deleteLoading || (stats?.total || 0) === 0}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Reset All Data
            </button>
          </div>
        </div>


        {/* Info Section */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Website vectors are created when scraping your website content</li>
                  <li>Document vectors are created when you approve uploaded documents</li>
                  <li>Video vectors are created when you process YouTube videos</li>
                  <li>All deletions are permanent and cannot be undone</li>
                  <li>Use "Reset All Data" carefully - it will delete everything from Pinecone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
