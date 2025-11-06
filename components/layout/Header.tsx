import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold text-primary-600">
          Hung Dinh
        </Link>
        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <Navigation />
        </div>
        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </header>
  )
}
