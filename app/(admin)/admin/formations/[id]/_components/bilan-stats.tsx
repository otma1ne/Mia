import { Card } from '@/components/ui/card'
import { getBilanStats } from '@/app/actions/bilans'
import { BarChart3 } from 'lucide-react'

interface BilanStatsProps {
  formationId: string
}

export default async function BilanStats({ formationId }: BilanStatsProps) {
  const stats = await getBilanStats(formationId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">Statistiques des Bilans</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bilan Chaud */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">📋 Bilan Chaud</h3>

          {stats.chaud.sent === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun bilan chaud envoyé pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Completion rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Taux de complétion</span>
                  <span className="font-semibold text-lg">
                    {stats.chaud.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${stats.chaud.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.chaud.completed}/{stats.chaud.sent} complétés
                </p>
              </div>

              {/* Ratings */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Note globale</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.chaud.avgOverallRating}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Contenu pédagogique</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.chaud.avgContentRating}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Qualité du formateur</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.chaud.avgTrainerRating}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Confiance acquise</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.chaud.avgConfidenceRating}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Recommandation</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.chaud.avgWouldRecommend}/5
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Bilan Froid */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">📋 Bilan Froid (3 mois)</h3>

          {stats.froid.sent === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun bilan froid envoyé pour le moment.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Completion rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Taux de complétion</span>
                  <span className="font-semibold text-lg">
                    {stats.froid.completionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${stats.froid.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.froid.completed}/{stats.froid.sent} complétés
                </p>
              </div>

              {/* Exam & Application rates */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Ont passé l&apos;examen</span>
                  <span className="font-semibold">{stats.froid.examTakenRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>L&apos;ont réussi</span>
                  <span className="font-semibold text-green-600">
                    {stats.froid.examPassedRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Appliquent les acquis</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.froid.avgApplyingRating}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Progression</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.froid.avgProgressRating}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Recommandation</span>
                  <span className="font-semibold text-yellow-500">
                    ★ {stats.froid.avgWouldRecommend}/5
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Besoin formation complémentaire</span>
                  <span className="font-semibold text-amber-600">
                    {stats.froid.needsSupportRate}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
