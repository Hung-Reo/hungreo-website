'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const { t } = useLanguage()

  // Navigation items with translation keys (same as desktop)
  const navItems = [
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
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
        aria-label="Toggle menu"
      >
        <span
          className={cn(
            'h-0.5 w-6 bg-slate-900 transition-all',
            isOpen && 'translate-y-2 rotate-45'
          )}
        />
        <span
          className={cn(
            'h-0.5 w-6 bg-slate-900 transition-all',
            isOpen && 'opacity-0'
          )}
        />
        <span
          className={cn(
            'h-0.5 w-6 bg-slate-900 transition-all',
            isOpen && '-translate-y-2 -rotate-45'
          )}
        />
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-16 border-b bg-white shadow-lg">
          <nav className="container mx-auto flex flex-col px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className={cn(
                  'rounded-lg px-4 py-3 text-base font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {t('header.admin')}
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
