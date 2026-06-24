'use client'

import { useRouter } from 'next/navigation'
import type { FormationDetailResult } from '@/app/actions/student-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  MapPin, Monitor, Video, BookOpen, Calendar, User,
  ChevronLeft, ClipboardCheck, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import ModuleCard from '@/components/modules/module-card'
import type { FormationType } from '@prisma/client'

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const formationTypeConfig: Record<FormationType, { label: string; icon: typeof MapPin; className: string }> = {
  PRESENTIAL:   { label: 'Présentiel',    icon: MapPin,    className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REMOTE_LIVE:  { label: 'En ligne live', icon: Monitor,   className: 'bg-violet-50 text-violet-700 border-violet-200' },
  REMOTE_ASYNC: { label: 'Autonome',      icon: Video,     className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

interface Props {
  formation: FormationDetailResult
}

export default function FormationDetailClient({ formation }: Props) {
  const router = useRouter()
  const typeCfg = formationTypeConfig[formation.type]
  const TypeIcon = typeCfg.icon

  const completedCount = formation.modules.filter(m => m.isCompleted).length
  const totalCount     = formation.modules.length

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="self-start -ml-2 text-muted-foreground"
        onClick={() => router.back()}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Retour
      </Button>

      {/* Header card */}
      <Card>
        <CardContent className="py-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold leading-snug">{formation.title}</h1>
              <p className="text-sm text-muted-foreground">{formation.description}</p>
            </div>
            <Badge variant="outline" className={cn('gap-1 shrink-0', typeCfg.className)}>
              <TypeIcon className="h-3 w-3" />
              {typeCfg.label}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {formation.categoryName}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Dates à définir
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {formation.enrollmentCount} / {formation.maxStudents} inscrits
            </span>
          </div>

          {/* Overall progress */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Progression — {completedCount} / {totalCount} module{totalCount !== 1 ? 's' : ''} terminé{completedCount !== 1 ? 's' : ''}
              </span>
              <span className="font-medium tabular-nums">{formation.enrollmentProgress}%</span>
            </div>
            <Progress value={formation.enrollmentProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Modules list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Parcours ({totalCount} module{totalCount !== 1 ? 's' : ''})
        </h2>

        {formation.modules.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucun module disponible pour cette formation.</p>
        )}

        {formation.modules.map((module, idx) => (
          <ModuleCard
            key={module.id}
            module={module}
            formationId={formation.id}
            orderNumber={idx + 1}
          />
        ))}

        {/* Final evaluation card */}
        {totalCount > 0 && (
          <div className={cn(
            'rounded-xl border-2 border-dashed p-4 transition-all',
            formation.allModulesCompleted
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-muted-foreground/20 opacity-60'
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  formation.allModulesCompleted ? 'bg-emerald-100' : 'bg-muted'
                )}>
                  <ClipboardCheck className={cn(
                    'h-4 w-4',
                    formation.allModulesCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Évaluation finale</p>
                  <p className="text-xs text-muted-foreground">
                    {formation.allModulesCompleted
                      ? 'Tous les modules sont terminés. Vous pouvez passer l\'évaluation finale.'
                      : `Terminez tous les modules pour débloquer l'évaluation finale.`}
                  </p>
                </div>
              </div>

              {formation.allModulesCompleted ? (
                <Link href={`/student/formations/${formation.id}/evaluation`} className={buttonVariants({ size: 'sm' })}>
                  Commencer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <div className="text-xs text-muted-foreground shrink-0">
                  {completedCount}/{totalCount} modules
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
