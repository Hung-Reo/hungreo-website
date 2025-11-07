import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DocumentsManager } from '@/components/admin/DocumentsManager'

export default async function DocumentsPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <DocumentsManager />
}
