'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'

const publicNavItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/tools/knowledge', label: 'AI Tools' },
  { href: '/contact', label: 'Contact' },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Show admin link only if user is authenticated as admin
  const isAdmin = session?.user && (session.user as any).role === 'admin'

  return (
    <nav className="flex gap-6">
      {publicNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary-600',
            pathname === item.href
              ? 'text-primary-600'
              : 'text-slate-600'
          )}
        >
          {item.label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin/dashboard"
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary-600',
            pathname.startsWith('/admin')
              ? 'text-primary-600'
              : 'text-slate-600'
          )}
        >
          Admin
        </Link>
      )}
    </nav>
  )
}
