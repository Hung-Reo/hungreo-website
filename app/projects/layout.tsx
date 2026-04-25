import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Projects',
  description: 'Initiatives, reflections, and work that matters — from Minh Tran, Digital & Operations Leader.',
  path: '/projects',
})

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
