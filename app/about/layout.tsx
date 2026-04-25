import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Khu Vườn Nhỏ',
  description: 'Learn more about Minh Tran — 20 years at Unilever as Head of Digital & Technology Consulting, Supply Chain Greater Asia. Now building what comes next.',
  path: '/about',
})

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
