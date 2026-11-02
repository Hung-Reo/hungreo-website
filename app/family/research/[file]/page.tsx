import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getCard, getViewer } from '@/lib/research/repository'
import { ResearchCardView } from '@/components/research/ResearchCardView'

// Cards are private: read per request, never at build time.
export const dynamic = 'force-dynamic'

export default async function FamilyResearchCardPage({ params }: { params: Promise<{ file: string }> }) {
  const viewer = await getViewer()
  if (!viewer) redirect('/family/login')

  const { file } = await params
  const result = await getCard(file, viewer)
  if (!result) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link href="/family/research" className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Tất cả phiếu
      </Link>
      <ResearchCardView
        card={result.card}
        status={result.status}
        topics={result.topics}
        sourceLabel={result.sourceLabel}
      />
    </main>
  )
}
