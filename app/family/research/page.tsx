import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getViewer, listCards } from '@/lib/research/repository'
import { ResearchIndex } from '@/components/research/ResearchIndex'
import { SignOutButton } from '@/components/research/SignOutButton'

// Cards are private: read per request, never at build time.
export const dynamic = 'force-dynamic'

export default async function FamilyResearchPage() {
  // Middleware already gates /family; checked again here so the page never relies on it alone.
  const viewer = await getViewer()
  if (!viewer) redirect('/family/login')

  let result: Awaited<ReturnType<typeof listCards>>
  let error = false
  try {
    result = await listCards(viewer)
  } catch (e) {
    console.error('[FamilyResearch] list failed:', e instanceof Error ? e.message : e)
    result = null
    error = true
  }
  if (!result && !error) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Phiếu research giáo dục</h1>
          <p className="mt-1 text-sm text-slate-500">
            {viewer.role === 'admin' ? 'Mọi phiếu, kèm trạng thái duyệt.' : 'Các phiếu Hưng đã duyệt.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {viewer.role === 'admin' && (
            <Link href="/admin/dashboard" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
              Admin
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>

      {error || !result ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Không đọc được nguồn phiếu lúc này. Thử tải lại sau ít phút.
        </p>
      ) : (
        <>
          <ResearchIndex cards={result.cards} showStatusFilter={viewer.role === 'admin'} />
          <p className="mt-8 text-xs text-slate-400">Nguồn dữ liệu: {result.sourceLabel}</p>
        </>
      )}
    </main>
  )
}
