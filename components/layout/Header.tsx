'use client'

import Link from 'next/link'
import { Navigation } from './Navigation'
import { MobileNav } from './MobileNav'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { TurtleWalker } from '@/components/TurtleWalker'

export function Header() {
  const handleTurtleClick = () => {
    // Dispatch custom event to open chatbot
    window.dispatchEvent(new CustomEvent('openChatbot'))
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      {/* Turtle Walker - positioned relative to header */}
      <div className="relative">
        <TurtleWalker onClick={handleTurtleClick} />
      </div>

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
