import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Blog',
  description: 'Technical articles, insights, and tutorials on software engineering, web development, product management, and technology trends.',
  path: '/blog',
})

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
