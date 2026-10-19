import { redirect } from 'next/navigation'

// Middleware already sends unauthenticated visitors to /admin/login.
export default function AdminIndexPage() {
  redirect('/admin/dashboard')
}
