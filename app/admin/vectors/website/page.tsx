import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { WebsiteVectorsManager } from '@/components/admin/WebsiteVectorsManager'

export default async function WebsiteVectorsPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <WebsiteVectorsManager />
}
