'use client'

import Link from 'next/link'
import type { FormationDetailModule } from '@/app/actions/student-dashboard'
import { cn } from '@/lib/utils'
import {
  Lock, CheckCircle2, BookOpen, Car, ClipboardCheck,
  Clock, Video, ChevronRight, Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─────────────────────────────────────────
// Type config
// ─────────────────────────────────────────

const typeConfig = {
  THEORY:     { label: 'Théorie',    icon: BookOpen,        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  PRACTICAL:  { label: 'Conduite',   icon: Car,             classes: 'bg-green-50 text-green-700 border-green-200' },
  ASSESSMENT: { label: 'Évaluation', icon: ClipboardCheck,  classes: 'bg-purple-50 text-purple-700 border-purple-200' },
}

// ─────────────────────────────────────────
// Props
// ─────────────────────────────────────────

interface ModuleCardProps {
  module: FormationDetailModule
  formationId: string
  orderNumber: number
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function ModuleCard({ module, formationId, orderNumber }: ModuleCardProps) {
  const { label: typeLabel, icon: TypeIcon, classes: typeClasses } = typeConfig[module.type]

  const isPractical  = module.type === 'PRACTICAL'
  const isAssessment = module.type === 'ASSESSMENT'

  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-all',
        module.isLocked && 'opacity-60 cursor-not-allowed',
        !module.isLocked && !module.isCompleted && 'hover:shadow-sm',
        module.isCompleted && 'border-emerald-200 bg-emerald-50/30'
      )}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start gap-3">
          {/* Order + status icon */}
          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
            {module.isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : module.isLocked ? (
              <Lock className="h-5 w-5 text-muted-foreground/50" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {orderNumber}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {/* Type badge */}
              <span className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                typeClasses
              )}>
                <TypeIcon className="h-3 w-3" />
                {typeLabel}
              </span>

              {/* Duration */}
              {module.duration > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {module.duration} min
                </span>
              )}

              {/* Completion badge */}
              {module.isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  Terminé
                </span>
              )}
            </div>

            <h3 className={cn(
              'font-semibold text-sm',
              module.isLocked && 'text-muted-foreground'
            )}>
              {module.title}
            </h3>

            {module.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {module.description}
              </p>
            )}

            {/* Trainer */}
            {module.trainerName && (
              <p className="text-xs text-muted-foreground mt-1">
                Formateur : {module.trainerName}
              </p>
            )}
          </div>

          {/* CTA arrow */}
          {!module.isLocked && !isPractical && (
            <Link
              href={`/student/formations/${formationId}/modules/${module.id}`}
              className={cn(
                'shrink-0 flex items-center justify-center h-8 w-8 rounded-full transition-colors',
                module.isCompleted
                  ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Progress bar (non-locked, not assessment) */}
        {!module.isLocked && !isAssessment && module.progress > 0 && (
          <div className="mt-3 ml-8">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progression</span>
              <span>{module.progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* PRACTICAL: sessions list */}
        {isPractical && module.sessions.length > 0 && (
          <div className="mt-3 ml-8 space-y-1.5">
            {module.sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between text-xs rounded-lg border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium">
                    {format(new Date(session.date), 'EEE d MMM', { locale: fr })}
                  </span>
                  <span className="text-muted-foreground">
                    {session.startTime} – {session.endTime}
                  </span>
                  {session.roomName && (
                    <span className="text-muted-foreground">· {session.roomName}</span>
                  )}
                </div>
                {session.attendanceStatus && (
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    session.attendanceStatus === 'PRESENT'  && 'bg-emerald-100 text-emerald-700',
                    session.attendanceStatus === 'ABSENT'   && 'bg-red-100 text-red-700',
                    session.attendanceStatus === 'LATE'     && 'bg-amber-100 text-amber-700',
                    session.attendanceStatus === 'EXCUSED'  && 'bg-blue-100 text-blue-700',
                  )}>
                    {session.attendanceStatus === 'PRESENT'  ? 'Présent'  :
                     session.attendanceStatus === 'ABSENT'   ? 'Absent'   :
                     session.attendanceStatus === 'LATE'     ? 'En retard' : 'Excusé'}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Locked message */}
        {module.isLocked && (
          <div className="mt-2 ml-8">
            <p className="text-xs text-muted-foreground/70 italic">
              Terminez le module précédent pour débloquer.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
