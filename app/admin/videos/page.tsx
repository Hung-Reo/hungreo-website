import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { VideosManager } from '@/components/admin/VideosManager'

export default async function VideosPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <VideosManager />
}
