'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    try {
      const payload = {
        page: pathname,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
      }

      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    } catch {
      // Silent fail
    }
  }, [pathname])

  return null
}
