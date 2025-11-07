import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <AdminDashboard />
}
