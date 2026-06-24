import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, CheckCircle2, Circle, Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Suivi des étudiants' }

const statusConfig = {
  ACTIVE:    { label: 'En cours',   classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Terminé',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DROPPED:   { label: 'Abandonné',  classes: 'bg-red-50 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspendu',   classes: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const moduleTypeLabel = {
  THEORY:     'Théorie',
  PRACTICAL:  'Conduite',
  ASSESSMENT: 'Évaluation',
}

export default async function SuiviPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id: formationId } = await params

  const formation = await db.formation.findUnique({
    where: { id: formationId },
    include: {
      modules: {
        where: { status: { not: 'ARCHIVED' } },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, title: true, type: true, orderIndex: true },
      },
    },
  })
  if (!formation) notFound()

  const enrollments = await db.formationEnrollment.findMany({
    where: { formationId },
    include: {
      user: { select: { name: true, email: true } },
      moduleEnrollments: {
        include: {
          module: { select: { id: true, orderIndex: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'asc' },
  })

  const modules = formation.modules

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href={`/admin/formations/${formationId}`}
          className="group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground size-8 mt-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">Suivi des étudiants</h1>
            <span className="text-sm text-muted-foreground">— {formation.title}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {enrollments.length} étudiant{enrollments.length !== 1 ? 's' : ''} inscrit{enrollments.length !== 1 ? 's' : ''}
              {' · '}
              {enrollments.filter(e => e.status === 'COMPLETED').length} terminé{enrollments.filter(e => e.status === 'COMPLETED').length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {enrollments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">Aucun étudiant inscrit</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Les étudiants apparaîtront ici une fois leurs inscriptions acceptées.
          </p>
        </div>
      )}

      {/* Module legend */}
      {modules.length > 0 && enrollments.length > 0 && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="font-medium">Modules :</span>
          {modules.map((m, i) => (
            <span key={m.id} className="flex items-center gap-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                {i + 1}
              </span>
              {m.title}
              <span className="text-muted-foreground/50">({moduleTypeLabel[m.type]})</span>
            </span>
          ))}
        </div>
      )}

      {/* Students list */}
      <div className="flex flex-col gap-3">
        {enrollments.map(enrollment => {
          const cfg = statusConfig[enrollment.status] ?? statusConfig.ACTIVE
          const moduleMap = new Map(
            enrollment.moduleEnrollments.map(me => [me.module.id, me])
          )

          return (
            <div
              key={enrollment.id}
              className="rounded-lg border bg-card p-4 flex flex-col gap-3"
            >
              {/* Student header */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm">{enrollment.user.name}</p>
                  <p className="text-xs text-muted-foreground">{enrollment.user.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inscrit le {format(new Date(enrollment.enrolledAt), 'dd MMM yyyy', { locale: fr })}
                    {enrollment.completedAt && (
                      <> · Terminé le {format(new Date(enrollment.completedAt), 'dd MMM yyyy', { locale: fr })}</>
                    )}
                  </p>
                </div>
                <Badge variant="outline" className={cn('shrink-0', cfg.classes)}>
                  {cfg.label}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <Progress value={enrollment.progress} className="h-2 flex-1" />
                <span className="text-xs font-medium tabular-nums text-muted-foreground w-8 shrink-0 text-right">
                  {enrollment.progress}%
                </span>
              </div>

              {/* Per-module status */}
              {modules.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 border-t">
                  {modules.map((m, i) => {
                    const me = moduleMap.get(m.id)
                    const done = !!me?.completedAt
                    const inProgress = me && !done && (me.progress ?? 0) > 0

                    return (
                      <div
                        key={m.id}
                        title={`Module ${i + 1}: ${m.title}`}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
                          done
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : inProgress
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-border text-muted-foreground'
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : inProgress ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                        <span className="font-medium">{i + 1}</span>
                        <span className="hidden sm:inline truncate max-w-[100px]">{m.title}</span>
                        {inProgress && (
                          <span className="tabular-nums">{me.progress}%</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
