import type { Metadata } from 'next'
import { BookOpen, Users, CalendarDays, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { getTrainerDashboardStats } from '@/app/actions/trainer-dashboard'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ModuleStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Dashboard — MIA Digital' }

const statusConfig: Record<ModuleStatus, { dot: string; label: string }> = {
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon' },
  PUBLISHED: { dot: 'bg-emerald-500',      label: 'Publié' },
  ARCHIVED:  { dot: 'bg-muted-foreground', label: 'Archivé' },
  COMPLETED: { dot: 'bg-blue-500',         label: 'Terminé' },
}

export default async function TrainerDashboardPage() {
  const stats = await getTrainerDashboardStats()

  const statCards = [
    {
      label: 'Mes modules',
      value: stats.totalModules,
      sub: `${stats.publishedModules} publiés`,
      icon: BookOpen,
      colour: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: 'Étudiants actifs',
      value: stats.totalStudents,
      sub: 'Inscrits dans vos cours',
      icon: Users,
      colour: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Séances à venir',
      value: stats.upcomingSessions.length,
      sub: '7 prochains jours',
      icon: CalendarDays,
      colour: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Taux de complétion',
      value: `${stats.completionRate}%`,
      sub: 'Étudiants ayant terminé',
      icon: TrendingUp,
      colour: 'bg-amber-100 text-amber-600',
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, sub, icon: Icon, colour }) => (
          <Card key={label}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-md shrink-0', colour)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Séances à venir</CardTitle>
            <CardDescription>7 prochains jours</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune séance prévue cette semaine.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.upcomingSessions.map(s => (
                  <div key={s.id} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10 text-primary">
                      <span className="text-[11px] font-medium leading-none">{format(new Date(s.date), 'MMM')}</span>
                      <span className="text-base font-bold leading-none mt-0.5">{format(new Date(s.date), 'd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.moduleTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.startTime} – {s.endTime}
                        {s.roomName && <> · {s.roomName}</>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modules summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Mes modules</CardTitle>
            <CardDescription>Récapitulatif de tous les modules assignés</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.modules.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucun module assigné pour l&apos;instant.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.modules.map(module => {
                  const { dot, label } = statusConfig[module.status]
                  return (
                    <div key={module.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{module.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
                          <span className="text-xs text-muted-foreground">{label}</span>
                        </div>
                      </div>
                      <div className="flex items-center shrink-0">
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">
                          {module.enrollmentCount} élève{module.enrollmentCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
