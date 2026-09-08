import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/metadata'
import HomeClient from './HomeClient'

// Server wrapper exists only so the home route can declare its own canonical;
// the page itself is a client component. Title/description stay inherited from
// the root layout so the homepage keeps the exact metadata it has today.
export const metadata: Metadata = {
  alternates: {
    canonical: BASE_URL,
  },
}

export default function HomePage() {
  return <HomeClient />
}
