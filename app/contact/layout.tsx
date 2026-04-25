import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact',
  description: 'Get in touch with Minh Tran. Connect via email or LinkedIn — about collaboration, consulting, or just a conversation.',
  path: '/contact',
})

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
