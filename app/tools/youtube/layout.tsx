import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/metadata'

export const metadata: Metadata = {
  alternates: {
    canonical: `${BASE_URL}/tools/youtube`,
  },
}

export default function YouTubeToolsLayout({ children }: { children: React.ReactNode }) {
  return children
}
