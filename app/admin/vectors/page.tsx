import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { VectorManager } from '@/components/admin/VectorManager'

export default async function VectorsPage() {
  const session = await auth()

  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/admin/login')
  }

  return <VectorManager />
}
