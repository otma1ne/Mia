import type { Metadata } from 'next'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDashboardStats, getRecentModules } from '@/app/actions/dashboard'
import ModulesTable from './_components/modules-table'

export const metadata: Metadata = { title: 'Tableau de bord — MIA Formation' }

function pctChange(current: number, prev: number) {
  if (prev === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - prev) / prev) * 100
  const sign   = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export default async function AdminDashboardPage() {
  const [stats, modules] = await Promise.all([
    getDashboardStats(),
    getRecentModules(),
  ])

  const statCards = [
    {
      label:  'Total élèves',
      value:  stats.totalStudents.toLocaleString(),
      pct:    pctChange(stats.totalStudents, stats.totalStudentsPrev),
      trend:  stats.totalStudents >= stats.totalStudentsPrev ? 'up' : 'down',
      strong: stats.totalStudents >= stats.totalStudentsPrev ? 'Base d\'élèves en croissance' : 'Nombre d\'élèves en baisse',
      sub:    'Par rapport au mois dernier',
    },
    {
      label:  'Nouvelles inscriptions',
      value:  stats.newEnrollments.toLocaleString(),
      pct:    pctChange(stats.newEnrollments, stats.newEnrollmentsPrev),
      trend:  stats.newEnrollments >= stats.newEnrollmentsPrev ? 'up' : 'down',
      strong: stats.newEnrollments >= stats.newEnrollmentsPrev ? 'Les inscriptions augmentent' : 'En baisse cette période',
      sub:    'Inscriptions créées ce mois-ci',
    },
    {
      label:  'Modules actifs',
      value:  stats.activeModules.toLocaleString(),
      pct:    pctChange(stats.activeModules, stats.activeModulesPrev),
      trend:  stats.activeModules >= stats.activeModulesPrev ? 'up' : 'down',
      strong: stats.activeModules >= stats.activeModulesPrev ? 'Activité solide' : 'Moins de modules actifs',
      sub:    'Modules publiés',
    },
    {
      label:  'Taux de complétion',
      value:  `${stats.completionRate}%`,
      pct:    pctChange(stats.completionRate, stats.completionRatePrev),
      trend:  stats.completionRate >= stats.completionRatePrev ? 'up' : 'down',
      strong: stats.completionRate >= stats.completionRatePrev ? 'Performance stable' : 'Taux en baisse',
      sub:    'Terminés / total des modules',
    },
  ] as const

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, pct, trend, strong, sub }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardAction>
                <Badge
                  variant="outline"
                  className={trend === 'up'
                    ? 'border-transparent bg-emerald-50 text-emerald-600'
                    : 'border-transparent bg-red-50 text-red-600'}
                >
                  {trend === 'up'
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />
                  }
                  {pct}
                </Badge>
              </CardAction>
              <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0.5">
                <p className="text-xs font-medium">{strong}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules table */}
      <ModulesTable modules={modules} />
    </div>
  )
}
