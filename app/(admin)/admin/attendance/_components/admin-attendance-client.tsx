'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle, Check, Loader2, User } from 'lucide-react'
import type { AttendanceStatus } from '@prisma/client'
import { saveAttendanceAdmin } from '@/app/actions/schedule'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SessionOption {
  id: string
  label: string
  date: Date
}

interface StudentEnrollment {
  id: string              // moduleEnrollmentId
  userId: string
  formationEnrollmentId: string
  user: { name: string; email: string }
}

interface AttendanceRecord {
  id: string
  status: AttendanceStatus
  moduleEnrollmentId: string
  note: string | null
}

interface SessionData {
  id: string
  date: Date
  startTime: string
  endTime: string
  trainer: { user: { name: string } } | null
  module: {
    title: string
    formation: { title: string }
    enrollments: StudentEnrollment[]
  }
  room: { name: string } | null
  attendances: AttendanceRecord[]
}

interface Props {
  sessionOptions: SessionOption[]
  selectedSessionId: string | null
  sessionData: SessionData | null
}

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; active: string; inactive: string }> = {
  PRESENT: {
    label: 'Présent',
    active:   'border-emerald-400 bg-emerald-50 text-emerald-700',
    inactive: 'border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600',
  },
  ABSENT: {
    label: 'Absent',
    active:   'border-red-300 bg-red-50 text-red-700',
    inactive: 'border-border text-muted-foreground hover:border-red-200 hover:text-red-600',
  },
  LATE: {
    label: 'En retard',
    active:   'border-amber-300 bg-amber-50 text-amber-700',
    inactive: 'border-border text-muted-foreground hover:border-amber-200 hover:text-amber-600',
  },
  EXCUSED: {
    label: 'Excusé',
    active:   'border-blue-300 bg-blue-50 text-blue-700',
    inactive: 'border-border text-muted-foreground hover:border-blue-200 hover:text-blue-600',
  },
}

const STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export default function AdminAttendanceClient({
  sessionOptions,
  selectedSessionId,
  sessionData,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local attendance state: moduleEnrollmentId → status
  const [localStatus, setLocalStatus] = useState<Record<string, AttendanceStatus>>(() => {
    if (!sessionData) return {}
    const map: Record<string, AttendanceStatus> = {}
    for (const enrollment of sessionData.module.enrollments) {
      const existing = sessionData.attendances.find(
        a => a.moduleEnrollmentId === enrollment.id
      )
      map[enrollment.id] = existing?.status ?? 'ABSENT'
    }
    return map
  })

  const selectedLabel = selectedSessionId
    ? sessionOptions.find(o => o.id === selectedSessionId)
    : null

  function handleSessionChange(value: unknown) {
    setSaved(false)
    setError(null)
    router.push(`?sessionId=${String(value)}`)
  }

  function handleStatus(moduleEnrollmentId: string, status: AttendanceStatus) {
    setSaved(false)
    setLocalStatus(prev => ({ ...prev, [moduleEnrollmentId]: status }))
  }

  function handleSave() {
    if (!sessionData) return
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const records = Object.entries(localStatus).map(([moduleEnrollmentId, status]) => ({
        moduleEnrollmentId,
        status,
      }))
      const result = await saveAttendanceAdmin(sessionData.id, records)
      if (result?.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const presentCount = Object.values(localStatus).filter(s => s === 'PRESENT').length

  if (sessionOptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p>Aucune séance prévue pour les 30 prochains jours.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Session selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner une séance</CardTitle>
          <CardDescription>Choisissez une séance pour consulter et modifier les présences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId ?? ''} onValueChange={handleSessionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une séance…">
                {selectedLabel
                  ? `${format(new Date(selectedLabel.date), 'EEE d MMM', { locale: fr })} • ${selectedLabel.label}`
                  : 'Choisir une séance…'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-80">
              {sessionOptions.map(opt => (
                <SelectItem key={opt.id} value={opt.id}>
                  {format(new Date(opt.date), 'EEE d MMM', { locale: fr })} • {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Session detail + attendance */}
      {sessionData && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle>{sessionData.module.title}</CardTitle>
                <CardDescription className="mt-1">
                  {sessionData.module.formation.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-5">
            {/* Meta info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-muted p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(sessionData.date), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Horaires</p>
                <p className="font-medium">{sessionData.startTime} – {sessionData.endTime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Formateur</p>
                <p className="font-medium">{sessionData.trainer?.user.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Présents</p>
                <p className="font-medium">
                  {presentCount} / {sessionData.module.enrollments.length}
                </p>
              </div>
              {sessionData.room && (
                <div>
                  <p className="text-xs text-muted-foreground">Salle</p>
                  <p className="font-medium">{sessionData.room.name}</p>
                </div>
              )}
            </div>

            {/* Student rows */}
            {sessionData.module.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun étudiant inscrit à cette séance.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {sessionData.module.enrollments.map(enrollment => {
                  const current = localStatus[enrollment.id] ?? 'ABSENT'

                  return (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 flex-wrap"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{enrollment.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{enrollment.user.email}</p>
                      </div>
                      <div className="flex gap-1.5 flex-wrap shrink-0">
                        {STATUSES.map(status => {
                          const cfg = STATUS_CONFIG[status]
                          const isActive = current === status
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleStatus(enrollment.id, status)}
                              className={cn(
                                'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                                isActive ? cfg.active : cfg.inactive
                              )}
                            >
                              {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Save row */}
            {sessionData.module.enrollments.length > 0 && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <Button onClick={handleSave} disabled={isPending} size="sm">
                  {isPending
                    ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Enregistrement…</>
                    : 'Enregistrer les présences'}
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                    <Check className="h-4 w-4" />
                    Enregistré
                  </span>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!sessionData && selectedSessionId && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p>Séance introuvable.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
