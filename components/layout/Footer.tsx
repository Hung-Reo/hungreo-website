import Link from 'next/link'
import { Shield } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm text-slate-600">
              © {currentYear} Hung Dinh. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              <span>Secured with HTTPS | GDPR Compliant | No Tracking</span>
              <Link href="/security" className="ml-1 underline hover:text-primary-600">
                Learn More
              </Link>
            </div>
          </div>
          <div className="flex gap-6">
            <Link
              href="mailto:hungreo2005@gmail.com"
              className="text-slate-600 hover:text-primary-600"
            >
              Email
            </Link>
            <Link
              href="https://www.linkedin.com/in/hưng-đinh-03742217b/"
              target="_blank"
              className="text-slate-600 hover:text-primary-600"
            >
              LinkedIn
            </Link>
            <Link
              href="https://github.com/Hung-Reo"
              target="_blank"
              className="text-slate-600 hover:text-primary-600"
            >
              GitHub
            </Link>
            <Link
              href="/security"
              className="text-slate-600 hover:text-primary-600"
            >
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
