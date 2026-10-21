import type { Metadata } from 'next'
import { BASE_URL } from '@/lib/metadata'
import { DEFAULT_HOME_NOW } from '@/lib/homeNow'
import { getHomeNow } from '@/lib/homeNowStore'
import HomeClient from './HomeClient'

// Server wrapper declares the home canonical and reads the "Building now /
// Learning now" block that is edited in Admin → Home. Title/description stay
// inherited from the root layout so the homepage keeps the exact metadata it has today.
export const metadata: Metadata = {
  alternates: {
    canonical: BASE_URL,
  },
}

// Read the block on every request so an admin edit shows without a deploy.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const now = (await getHomeNow()) || DEFAULT_HOME_NOW
  return <HomeClient now={now} />
}
