'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/tools/youtube', label: 'AI Tools' },
  { href: '/contact', label: 'Contact' },
  { href: '/admin/login', label: 'Admin' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-6">
      {navItems.map((item) => (
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
    </nav>
  )
}
