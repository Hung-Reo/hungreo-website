'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useLanguage()

  // Navigation items with translation keys
  const publicNavItems = [
    { href: '/', labelKey: 'header.home' },
    { href: '/about', labelKey: 'header.about' },
    { href: '/projects', labelKey: 'header.projects' },
    { href: '/blog', labelKey: 'header.blog' },
    { href: '/tools/knowledge', labelKey: 'header.aiTools' },
    { href: '/contact', labelKey: 'header.contact' },
  ]

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
          {t(item.labelKey)}
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
          {t('header.admin')}
        </Link>
      )}
    </nav>
  )
}
