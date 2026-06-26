import type { Metadata } from 'next'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getDashboardStats, getRecentModules, getRevenueDashboard } from '@/app/actions/dashboard'
import ModulesTable from './_components/modules-table'
import RevenueChart from './_components/revenue-chart'

export const metadata: Metadata = { title: 'Tableau de bord — MIA Digital' }

function pctChange(current: number, prev: number) {
  if (prev === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - prev) / prev) * 100
  const sign   = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

function formatMAD(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M €`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k €`
  return `${n.toLocaleString('fr-FR')} €`
}

export default async function AdminDashboardPage() {
  const [stats, modules, revenue] = await Promise.all([
    getDashboardStats(),
    getRecentModules(),
    getRevenueDashboard(),
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

  const revenueCards = [
    {
      label:   'CA cette semaine',
      value:   formatMAD(revenue.revenueThisWeek),
      pct:     pctChange(revenue.revenueThisWeek, revenue.revenueLastWeek),
      trend:   revenue.revenueThisWeek >= revenue.revenueLastWeek ? 'up' : 'down',
      sub:     'vs semaine dernière',
    },
    {
      label:   'CA ce mois',
      value:   formatMAD(revenue.revenueThisMonth),
      pct:     pctChange(revenue.revenueThisMonth, revenue.revenueLastMonth),
      trend:   revenue.revenueThisMonth >= revenue.revenueLastMonth ? 'up' : 'down',
      sub:     `${revenue.inscriptionsThisMonth} inscription${revenue.inscriptionsThisMonth !== 1 ? 's' : ''} signée${revenue.inscriptionsThisMonth !== 1 ? 's' : ''}`,
    },
    {
      label:   'CA cette année',
      value:   formatMAD(revenue.revenueThisYear),
      pct:     pctChange(revenue.revenueThisYear, revenue.revenueLastYear),
      trend:   revenue.revenueThisYear >= revenue.revenueLastYear ? 'up' : 'down',
      sub:     'vs année précédente',
    },
  ] as const

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Activity KPI cards */}
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

      {/* Revenue section */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold">Chiffre d&apos;affaires</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inscriptions acceptées (contrats signés) × tarif de formation
          </p>
        </div>

        {/* Revenue KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {revenueCards.map(({ label, value, pct, trend, sub }) => (
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
                <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">CA mois par mois</CardTitle>
            <CardDescription>12 derniers mois — inscriptions acceptées</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenue.monthly} />
          </CardContent>
        </Card>
      </div>

      {/* Modules table */}
      <ModulesTable modules={modules} />
    </div>
  )
}
