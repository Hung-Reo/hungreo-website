import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-slate-600">
            © {currentYear} Hung Dinh. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="https://linkedin.com/in/yourprofile"
              target="_blank"
              className="text-slate-600 hover:text-primary-600"
            >
              LinkedIn
            </Link>
            <Link
              href="https://github.com/yourprofile"
              target="_blank"
              className="text-slate-600 hover:text-primary-600"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
