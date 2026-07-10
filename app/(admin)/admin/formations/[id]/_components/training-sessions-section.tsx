'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CalendarRange, Users, ChevronDown, Plus, Check,
  MapPin, Monitor, ExternalLink, GraduationCap,
} from 'lucide-react'
import type { TrainingNiveau } from '@prisma/client'
import { cn } from '@/lib/utils'
import type { TrainingSessionRow } from '@/app/actions/training-sessions'
import { updateTrainingSessionStatus } from '@/app/actions/training-sessions'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { TrainingSessionStatus } from '@prisma/client'
import CreateTrainingSessionDialog from './create-training-session-dialog'

const NIVEAU_CONFIG: Record<TrainingNiveau, { label: string; className: string }> = {
  START:  { label: 'MIA Bronze – Niv. 1', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  PRO:    { label: 'MIA Argent – Niv. 2', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  EXPERT: { label: 'MIA Or – Niv. 3',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const STATUS_CONFIG: Record<TrainingSessionStatus, { label: string; dot: string; badge: string }> = {
  DRAFT:     { label: 'Brouillon',    dot: 'bg-amber-400',         badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  OPEN:      { label: 'Ouverte',      dot: 'bg-emerald-500',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  STARTED:   { label: 'En cours',     dot: 'bg-blue-500',          badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { label: 'Terminée',     dot: 'bg-muted-foreground',  badge: 'bg-muted text-muted-foreground' },
  CANCELLED: { label: 'Annulée',      dot: 'bg-red-400',           badge: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_ORDER: TrainingSessionStatus[] = ['DRAFT', 'OPEN', 'STARTED', 'COMPLETED', 'CANCELLED']

interface Props {
  formationId: string
  initialSessions: TrainingSessionRow[]
  trainers: { id: string; name: string }[]
}

export default function TrainingSessionsSection({ formationId, initialSessions, trainers }: Props) {
  const [sessions, setSessions] = useState(initialSessions)
  const [createOpen, setCreateOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleCreated(row: TrainingSessionRow) {
    setSessions(prev => [...prev, row])
    setCreateOpen(false)
  }

  function handleStatusChange(id: string, status: TrainingSessionStatus) {
    setUpdatingId(id)
    startTransition(async () => {
      await updateTrainingSessionStatus(id, status)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
      setUpdatingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            Sessions / Promotions
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({sessions.length})
            </span>
          </h2>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="h-7 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Nouvelle session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <CalendarRange className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucune session créée</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Créez une session pour ouvrir les inscriptions à ce groupe.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map(s => {
            const cfg = STATUS_CONFIG[s.status]
            return (
              <div key={s.id} className="rounded-xl border bg-card p-4 flex flex-col gap-3">
                {/* Row 1: title + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold leading-snug truncate">{s.title}</p>
                      {s.niveau && (
                        <span className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                          NIVEAU_CONFIG[s.niveau].className,
                        )}>
                          <GraduationCap className="h-2.5 w-2.5" />
                          {NIVEAU_CONFIG[s.niveau].label}
                        </span>
                      )}
                    </div>
                    {s.trainerName && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Formateur : {s.trainerName}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          disabled={updatingId === s.id}
                          aria-label={`Statut : ${cfg.label}`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60"
                        />
                      }
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {STATUS_ORDER.filter(st => st !== s.status).map(st => (
                        <DropdownMenuItem key={st} onClick={() => handleStatusChange(s.id, st)}>
                          {STATUS_CONFIG[st].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Row 2: dates + capacity */}
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                    {format(new Date(s.startDate), 'd MMM yyyy', { locale: fr })}
                    {' → '}
                    {format(new Date(s.endDate), 'd MMM yyyy', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    {s.enrollmentCount} / {s.maxStudents} inscrits
                    {s.inscriptionCount > 0 && (
                      <span className="text-amber-600">· {s.inscriptionCount} en attente</span>
                    )}
                  </span>
                  {s.price != null && (
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      {s.price.toLocaleString('fr-FR')} €
                    </span>
                  )}
                  {s.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {s.location}
                    </span>
                  )}
                  {s.onlineUrl && (
                    <a
                      href={s.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Monitor className="h-3.5 w-3.5 shrink-0" />
                      Lien en ligne
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {s.notes && (
                  <p className="text-xs text-muted-foreground italic border-t pt-2">{s.notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <CreateTrainingSessionDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        formationId={formationId}
        trainers={trainers}
      />
    </div>
  )
}
