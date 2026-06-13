import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { db } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { getBilanStats } from '@/app/actions/bilans'

export const metadata = { title: 'Gestion des bilans' }

export default async function BilansPage() {
  // Get all formations with enrollment count
  const formations = await db.formation.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get bilan stats for each formation
  const formationStats = await Promise.all(
    formations.map(async (formation) => ({
      ...formation,
      stats: await getBilanStats(formation.id),
    }))
  )

  // Filter to only formations with bilans
  const formationsWithBilans = formationStats.filter(
    (f) => f.stats.chaud.sent > 0 || f.stats.froid.sent > 0
  )

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Bilans des formations</h1>
        <p className="text-sm text-muted-foreground">
          Consultation des statistiques des bilans chauds et froids par formation
        </p>
      </div>

      {formationsWithBilans.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucun bilan pour le moment. Les bilans apparaîtront ici une fois que les étudiants auront complété leurs formations.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {formationsWithBilans.map((formation) => {
            const chaudTotal = formation.stats.chaud.sent
            const froidTotal = formation.stats.froid.sent
            const totalBilans = chaudTotal + froidTotal

            return (
              <Link
                key={formation.id}
                href={`/admin/bilans/${formation.id}`}
                className="group"
              >
                <Card className="p-6 transition-all hover:shadow-md hover:border-primary/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <h2 className="font-semibold text-lg truncate">
                          {formation.title}
                        </h2>
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {totalBilans} bilan{totalBilans !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        {/* Bilan Chaud */}
                        <div>
                          <p className="text-muted-foreground">Chaud</p>
                          <p className="font-semibold">
                            {formation.stats.chaud.completed}/{chaudTotal}
                          </p>
                          {chaudTotal > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {formation.stats.chaud.completionRate}% complétés
                            </p>
                          )}
                        </div>

                        {/* Bilan Froid */}
                        <div>
                          <p className="text-muted-foreground">Froid</p>
                          <p className="font-semibold">
                            {formation.stats.froid.completed}/{froidTotal}
                          </p>
                          {froidTotal > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {formation.stats.froid.completionRate}% complétés
                            </p>
                          )}
                        </div>

                        {/* Avg Rating */}
                        {chaudTotal > 0 && (
                          <div>
                            <p className="text-muted-foreground">Note moyenne</p>
                            <p className="font-semibold text-yellow-500">
                              ★ {formation.stats.chaud.avgOverallRating}/5
                            </p>
                          </div>
                        )}

                        {/* Enrollments */}
                        <div>
                          <p className="text-muted-foreground">Inscrits</p>
                          <p className="font-semibold">
                            {formation._count.enrollments}
                          </p>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
