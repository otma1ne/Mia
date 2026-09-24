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
  Calendar, Clock, ExternalLink, BookOpen, ClipboardCheck,
  Play, XCircle, MapPin, UserCheck, UserX, AlertCircle,
} from 'lucide-react'
import type { AttendanceStatus } from '@prisma/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ModuleType } from '@prisma/client'

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const typeConfig: Record<ModuleType, { label: string; icon: typeof BookOpen; classes: string }> = {
  THEORY:     { label: 'Théorie',    icon: BookOpen,        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  PRACTICAL:  { label: 'Pratique',   icon: ClipboardCheck,  classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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
// Attendance badge
// ─────────────────────────────────────────

const ATTENDANCE_CONFIG: Record<AttendanceStatus, { label: string; classes: string; icon: typeof UserCheck }> = {
  PRESENT: { label: 'Présent',  classes: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: UserCheck },
  ABSENT:  { label: 'Absent',   classes: 'text-red-600 bg-red-50 border-red-200',             icon: UserX },
  LATE:    { label: 'Retard',   classes: 'text-amber-600 bg-amber-50 border-amber-200',       icon: Clock },
  EXCUSED: { label: 'Excusé',   classes: 'text-blue-600 bg-blue-50 border-blue-200',          icon: AlertCircle },
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

      {/* Sessions planifiées */}
      {module.sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Séances planifiées
          </h2>
          <div className="flex flex-col gap-2">
            {module.sessions.map(s => {
              const isPast = new Date(s.date) < new Date()
              const attendance = s.attendanceStatus ? ATTENDANCE_CONFIG[s.attendanceStatus] : null
              const AttIcon = attendance?.icon
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm',
                    isPast ? 'bg-muted/40' : 'bg-card'
                  )}
                >
                  <div className="flex-1 min-w-0 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-medium capitalize">
                      {format(new Date(s.date), 'EEEE d MMM yyyy', { locale: fr })}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      {s.startTime} → {s.endTime}
                    </span>
                    {s.roomName && (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {s.roomName}
                      </span>
                    )}
                  </div>
                  {attendance && AttIcon ? (
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
                      attendance.classes
                    )}>
                      <AttIcon className="h-3 w-3" />
                      {attendance.label}
                    </span>
                  ) : isPast ? (
                    <span className="text-xs text-muted-foreground/60 shrink-0 italic">Non renseigné</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 shrink-0">À venir</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Video */}
      {module.videoUrl && (
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

      {/* Materials */}
      {(
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
            <div className="flex flex-col gap-2">
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
