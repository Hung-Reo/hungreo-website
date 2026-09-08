import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/metadata'
import KnowledgeClient from './KnowledgeClient'

// Wrapper (not a layout) so the canonical stays on this route only and is not
// inherited by /tools/knowledge/[category] and its video detail pages.
export const metadata: Metadata = {
  alternates: {
    canonical: `${BASE_URL}/tools/knowledge`,
  },
}

export default function KnowledgePage() {
  return <KnowledgeClient />
}
