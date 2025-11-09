'use client'

import Link from 'next/link'
import { BookOpen, Brain, Heart, Smile, Users } from 'lucide-react'

export type VideoCategory = 'Leadership' | 'AI Works' | 'Health' | 'Entertaining' | 'Human Philosophy'

interface CategoryStats {
  leadership?: number
  aiWorks?: number
  health?: number
  entertaining?: number
  philosophy?: number
  total?: number
}

interface CategoryGridProps {
  stats: CategoryStats | null
}

const CATEGORIES = [
  {
    id: 'leadership' as const,
    name: 'Leadership',
    slug: 'leadership',
    description: 'Learn from great leaders about vision, motivation, and inspiring teams',
    icon: Users,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
  },
  {
    id: 'aiWorks' as const,
    name: 'AI Works',
    slug: 'ai-works',
    description: 'Explore artificial intelligence, machine learning, and the future of technology',
    icon: Brain,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
  },
  {
    id: 'health' as const,
    name: 'Health',
    slug: 'health',
    description: 'Discover insights on physical and mental well-being, fitness, and nutrition',
    icon: Heart,
    color: 'bg-red-500',
    hoverColor: 'hover:bg-red-600',
  },
  {
    id: 'entertaining' as const,
    name: 'Entertaining',
    slug: 'entertaining',
    description: 'Enjoy thought-provoking entertainment, comedy, and creative content',
    icon: Smile,
    color: 'bg-yellow-500',
    hoverColor: 'hover:bg-yellow-600',
  },
  {
    id: 'philosophy' as const,
    name: 'Human Philosophy',
    slug: 'human-philosophy',
    description: 'Dive into philosophical questions about life, meaning, and human nature',
    icon: BookOpen,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
  },
]

export function CategoryGrid({ stats }: CategoryGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((category) => {
        const Icon = category.icon
        const count = stats?.[category.id] || 0

        return (
          <Link
            key={category.slug}
            href={`/tools/knowledge/${category.slug}`}
            className="group block rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
          >
            {/* Icon & Badge */}
            <div className="mb-4 flex items-start justify-between">
              <div className={`rounded-lg ${category.color} p-3 text-white transition-colors ${category.hoverColor}`}>
                <Icon className="h-6 w-6" />
              </div>
              {count > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {count} video{count !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="mb-2 text-xl font-semibold text-slate-900 group-hover:text-primary-600">
              {category.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600">
              {category.description}
            </p>

            {/* Arrow indicator */}
            <div className="mt-4 flex items-center text-sm font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
              Browse videos
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
