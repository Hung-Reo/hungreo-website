import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Blog',
  description: 'Thoughts on business, people, Supply Chain, and what comes next — from 20 years at Unilever.',
  path: '/blog',
})

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
