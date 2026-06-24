'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { StudentModuleDetail, FormationDetailMaterial } from '@/app/actions/student-dashboard'
import { markModuleComplete } from '@/app/actions/modules'
import { markMaterialComplete } from '@/app/actions/student-dashboard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, Loader2, FileText, Video, Image, Link2,
  Calendar, Clock, ExternalLink, BookOpen, Car, ClipboardCheck,
  Play, XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ModuleType } from '@prisma/client'

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const typeConfig: Record<ModuleType, { label: string; icon: typeof BookOpen; classes: string }> = {
  THEORY:     { label: 'Théorie',    icon: BookOpen,        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  PRACTICAL:  { label: 'Conduite',   icon: Car,             classes: 'bg-green-50 text-green-700 border-green-200' },
  ASSESSMENT: { label: 'Évaluation', icon: ClipboardCheck,  classes: 'bg-purple-50 text-purple-700 border-purple-200' },
}

const materialIcons: Record<string, typeof FileText> = {
  pdf:   FileText,
  video: Video,
  image: Image,
  link:  Link2,
}

function MaterialIcon({ type }: { type: string }) {
  const Icon = materialIcons[type] ?? Link2
  return <Icon className="h-4 w-4 shrink-0" />
}

// ─────────────────────────────────────────
// Material row
// ─────────────────────────────────────────

function MaterialRow({
  material,
  onComplete,
}: {
  material: FormationDetailMaterial
  onComplete: (id: string) => void
}) {
  const [pending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      await markMaterialComplete(material.id)
      onComplete(material.id)
    })
  }

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors',
      material.completed ? 'border-emerald-200 bg-emerald-50/40' : 'bg-card'
    )}>
      <span className={material.completed ? 'text-emerald-500' : 'text-muted-foreground'}>
        <MaterialIcon type={material.type} />
      </span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', material.completed && 'line-through text-muted-foreground')}>
          {material.title}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Ouvrir
          <ExternalLink className="h-3 w-3" />
        </a>
        {!material.completed && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-emerald-600"
            disabled={pending}
            onClick={handleComplete}
          >
            {pending
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <CheckCircle2 className="h-3 w-3" />}
            Terminé
          </Button>
        )}
        {material.completed && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            Fait
          </span>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

interface ExamStatus {
  hasExam: boolean
  questionCount: number
  attemptStarted: boolean
  attemptSubmitted: boolean
  score: number | null
  passed: boolean | null
  needsGrading: boolean
}

interface Props {
  module: StudentModuleDetail
  examStatus?: ExamStatus | null
}

export default function ModuleViewClient({ module, examStatus }: Props) {
  const router = useRouter()
  const [materials, setMaterials] = useState<FormationDetailMaterial[]>(module.materials)
  const [isCompleted, setIsCompleted] = useState(module.isCompleted)
  const [completing, startCompleting] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const { label: typeLabel, icon: TypeIcon, classes: typeClasses } = typeConfig[module.type]

  const allMaterialsDone = materials.length === 0 || materials.every(m => m.completed)
  // For ASSESSMENT, completion happens via exam submission, not the manual button
  const canComplete = !isCompleted && allMaterialsDone && module.type === 'THEORY'

  function handleMaterialComplete(id: string) {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m))
  }

  function handleComplete() {
    setError(null)
    startCompleting(async () => {
      const result = await markModuleComplete(module.id)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsCompleted(true)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn('gap-1', typeClasses)}>
            <TypeIcon className="h-3 w-3" />
            {typeLabel}
          </Badge>
          {module.duration > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {module.duration} min
            </span>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" />
              Terminé
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{module.description}</p>
      </div>

      {/* Video (THEORY / ASSESSMENT) */}
      {module.type !== 'PRACTICAL' && module.videoUrl && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vidéo</h2>
          <div className="aspect-video w-full overflow-hidden rounded-xl border bg-black">
            <video
              src={module.videoUrl}
              controls
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      {/* Materials (THEORY / ASSESSMENT) */}
      {module.type !== 'PRACTICAL' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Ressources ({materials.length})
            </h2>
            {materials.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {materials.filter(m => m.completed).length} / {materials.length} terminées
              </span>
            )}
          </div>

          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aucune ressource disponible pour ce module.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {materials.map(mat => (
                <MaterialRow
                  key={mat.id}
                  material={mat}
                  onComplete={handleMaterialComplete}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sessions (PRACTICAL) */}
      {module.type === 'PRACTICAL' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Séances de conduite ({module.sessions.length})
          </h2>

          {module.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              Aucune séance planifiée pour ce module.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {module.sessions.map(session => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(session.date), 'EEEE d MMMM yyyy', { locale: fr })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.startTime} – {session.endTime}
                        {session.roomName && ` · ${session.roomName}`}
                      </p>
                    </div>
                  </div>

                  {session.attendanceStatus && (
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0',
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

          {/* Practical: completion is handled by trainer via attendance — inform student */}
          <p className="text-xs text-muted-foreground italic">
            La validation de ce module de conduite est effectuée par votre formateur après la séance.
          </p>
        </div>
      )}

      {/* ASSESSMENT: exam CTA */}
      {module.type === 'ASSESSMENT' && examStatus && (
        <div className="border-t pt-4 flex flex-col gap-3">
          {!examStatus.hasExam && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Aucun examen configuré pour ce module pour le moment.
            </div>
          )}

          {examStatus.hasExam && !examStatus.attemptSubmitted && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                {examStatus.questionCount} question{examStatus.questionCount !== 1 ? 's' : ''} ·
                Tentative unique
              </p>
              <Button size="lg" className="w-full sm:w-auto self-start" render={
                <Link href={`/student/formations/${module.formationId}/modules/${module.id}/exam`} />
              }>
                <Play className="h-4 w-4 mr-2" />
                {examStatus.attemptStarted ? 'Reprendre l\'examen' : 'Passer l\'examen'}
              </Button>
            </div>
          )}

          {examStatus.attemptSubmitted && (
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                {examStatus.needsGrading ? (
                  <>
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">En cours de correction</span>
                  </>
                ) : examStatus.passed ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Réussi — {examStatus.score}%</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Non réussi — {examStatus.score}%</span>
                  </>
                )}
              </div>
              <Button size="sm" variant="outline" render={
                <Link href={`/student/formations/${module.formationId}/modules/${module.id}/exam/result`} />
              }>
                Voir le résultat
              </Button>
            </div>
          )}
        </div>
      )}

      {/* THEORY: manual mark-complete */}
      {module.type === 'THEORY' && (
        <div className="border-t pt-4 flex flex-col gap-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Module terminé</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {!allMaterialsDone && materials.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Complétez toutes les ressources pour valider ce module.
                </p>
              )}
              <Button
                onClick={handleComplete}
                disabled={!canComplete || completing}
                className="w-full sm:w-auto"
              >
                {completing
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Validation…</>
                  : <><CheckCircle2 className="h-4 w-4 mr-2" />Valider ce module</>}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
