import Link from 'next/link'
import { db } from '@/lib/db'
import { getBilanStats } from '@/app/actions/bilans'
import { BarChart3, Users, ArrowRight, Thermometer, Snowflake } from 'lucide-react'

export const metadata = { title: 'Bilans — MIA Digital' }

export default async function BilansPage() {
  const formations = await db.formation.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const formationStats = await Promise.all(
    formations.map(async (f) => ({ ...f, stats: await getBilanStats(f.id) }))
  )

  const formationsWithBilans = formationStats.filter(
    (f) => f.stats.chaud.sent > 0 || f.stats.froid.sent > 0
  )

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold">Bilans des formations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formationsWithBilans.length === 0
            ? 'Aucun bilan disponible pour le moment.'
            : `${formationsWithBilans.length} formation${formationsWithBilans.length !== 1 ? 's' : ''} avec des bilans`}
        </p>
      </div>

      {/* Empty state */}
      {formationsWithBilans.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Aucun bilan pour l&apos;instant</p>
            <p className="text-xs text-muted-foreground mt-1">
              Les bilans apparaîtront ici une fois que les étudiants auront complété leurs formations.
            </p>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {formationsWithBilans.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {formationsWithBilans.map((f) => {
            const totalBilans = f.stats.chaud.sent + f.stats.froid.sent
            const hasChaud = f.stats.chaud.sent > 0
            const hasFroid = f.stats.froid.sent > 0

            return (
              <div
                key={f.id}
                className="flex flex-col rounded-2xl border bg-card overflow-hidden"
              >
                {/* Color band */}
                <div className="h-1 bg-linear-to-r from-amber-500 to-orange-400" />

                {/* Body */}
                <div className="flex flex-col gap-4 p-5 flex-1">
                  {/* Icon + title */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm leading-tight line-clamp-2">{f.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {f._count.enrollments} inscrit{f._count.enrollments !== 1 ? 's' : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px]">
                          {totalBilans} bilan{totalBilans !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col gap-3">
                    {/* Bilan Chaud */}
                    {hasChaud && (
                      <div className="rounded-xl bg-orange-50 px-3.5 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700">
                            <Thermometer className="h-3.5 w-3.5" />
                            Bilan chaud
                          </div>
                          <span className="text-[11px] text-orange-600">
                            {f.stats.chaud.completed}/{f.stats.chaud.sent} complétés
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full bg-orange-200">
                          <div className={`h-1.5 rounded-full bg-orange-500 transition-all w-[${f.stats.chaud.completionRate}%]`} />
                        </div>
                        {f.stats.chaud.avgOverallRating > 0 && (
                          <p className="mt-1.5 text-[11px] text-orange-600">
                            ★ {f.stats.chaud.avgOverallRating}/5 note moyenne
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bilan Froid */}
                    {hasFroid && (
                      <div className="rounded-xl bg-sky-50 px-3.5 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
                            <Snowflake className="h-3.5 w-3.5" />
                            Bilan froid
                          </div>
                          <span className="text-[11px] text-sky-600">
                            {f.stats.froid.completed}/{f.stats.froid.sent} complétés
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-sky-200">
                          <div className={`h-1.5 rounded-full bg-sky-500 transition-all w-[${f.stats.froid.completionRate}%]`} />
                        </div>
                        {f.stats.froid.examPassedRate > 0 && (
                          <p className="mt-1.5 text-[11px] text-sky-600">
                            {f.stats.froid.examPassedRate}% ont réussi l&apos;examen
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-2.5 bg-muted/30">
                  <Link
                    href={`/admin/bilans/${f.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Voir le détail
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
