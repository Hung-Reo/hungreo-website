import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Projects',
  description: 'Explore my portfolio of software engineering projects, web applications, and technical experiments using React, Next.js, TypeScript, and modern web technologies.',
  path: '/projects',
})

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
