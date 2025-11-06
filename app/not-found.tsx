import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-slate-900">
          Page Not Found
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Oops! The page you're looking for doesn't exist.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/blog">Read Blog</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
