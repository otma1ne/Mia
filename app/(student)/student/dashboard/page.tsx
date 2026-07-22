import type { Metadata } from 'next'
import { BookOpen, CheckCircle, CalendarDays } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStudentDashboardStats } from '@/app/actions/student-dashboard'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { EnrollmentStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Dashboard — MIA Académie' }

const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE:    { label: 'Actif',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'Terminé',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  DROPPED:   { label: 'Abandonné', className: 'bg-red-50 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspendu',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

export default async function StudentDashboardPage() {
  const stats = await getStudentDashboardStats()

  const statCards = [
    {
      label: 'Formations inscrites',
      value: stats.enrolledFormations,
      sub: 'Total des inscriptions',
      icon: BookOpen,
      colour: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: 'Terminées',
      value: stats.completedFormations,
      sub: 'Formations achevées',
      icon: CheckCircle,
      colour: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Séances à venir',
      value: stats.upcomingSessions.length,
      sub: '7 prochains jours',
      icon: CalendarDays,
      colour: 'bg-violet-100 text-violet-600',
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
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

        {/* Recent enrollments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Inscriptions récentes</CardTitle>
            <CardDescription>Vos dernières inscriptions aux cours</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentEnrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Aucune inscription pour l&apos;instant.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {stats.recentEnrollments.map(e => {
                  const statusCfg = enrollmentStatusConfig[e.status]
                  return (
                    <div key={e.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{e.formationTitle}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className={cn('text-[10px]', statusCfg.className)}>
                          {statusCfg.label}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${e.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">{e.progress}%</span>
                        </div>
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
