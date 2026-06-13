import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getFormation } from '@/app/actions/formations'
import { getBilanStats } from '@/app/actions/bilans'
import BilanStats from '../_components/bilan-stats'

export const metadata = { title: 'Détails des bilans' }

export default async function BilanDetailPage({
  params,
}: {
  params: Promise<{ formationId: string }>
}) {
  const { formationId } = await params
  const [formation, stats] = await Promise.all([
    getFormation(formationId),
    getBilanStats(formationId),
  ])

  if (!formation) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/bilans"
          className="group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground size-8 mt-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold mb-1">Bilans — {formation.title}</h1>
          <p className="text-sm text-muted-foreground">
            Statistiques des évaluations pour cette formation
          </p>
        </div>
      </div>

      {/* Bilan Stats Component */}
      <BilanStats formationId={formationId} />
    </div>
  )
}
