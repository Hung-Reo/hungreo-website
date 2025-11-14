import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary-600">
          Hung Dinh
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Navigation />
          <LanguageSwitcher />
        </div>
        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
