import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/metadata'

export const metadata: Metadata = {
  alternates: {
    canonical: `${BASE_URL}/security`,
  },
}

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children
}
