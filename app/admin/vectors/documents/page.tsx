import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DocumentVectorsManager } from '@/components/admin/DocumentVectorsManager'

export default async function DocumentVectorsPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <DocumentVectorsManager />
}
