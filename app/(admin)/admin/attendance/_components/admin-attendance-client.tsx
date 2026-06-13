'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { AlertCircle, User } from 'lucide-react'
import type { AttendanceStatus } from '@prisma/client'

interface SessionOption {
  id: string
  label: string
  date: Date
}

interface StudentAttendance {
  id: string
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
  module: {
    title: string
    formation: { title: string }
    trainer: { user: { name: string } } | null
    enrollments: StudentAttendance[]
  }
  room: { name: string } | null
  attendances: AttendanceRecord[]
}

interface AdminAttendanceClientProps {
  sessionOptions: SessionOption[]
  selectedSessionId: string | null
  sessionData: SessionData | null
}

const attendanceStatusConfig: Record<AttendanceStatus, { label: string; className: string }> = {
  PRESENT: { label: 'Présent', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  ABSENT: { label: 'Absent', className: 'bg-red-100 text-red-800 border-red-200' },
  LATE: { label: 'En retard', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  EXCUSED: { label: 'Excusé', className: 'bg-blue-100 text-blue-800 border-blue-200' },
}

export default function AdminAttendanceClient({
  sessionOptions,
  selectedSessionId,
  sessionData,
}: AdminAttendanceClientProps) {
  const router = useRouter()

  // Get the label for the selected session
  const selectedSession = selectedSessionId
    ? sessionOptions.find((opt) => opt.id === selectedSessionId)
    : null
  const selectedSessionLabel = selectedSession
    ? `${format(new Date(selectedSession.date), 'EEE d MMM', { locale: fr })} • ${selectedSession.label}`
    : ''

  const handleSessionChange = (value: unknown) => {
    const sessionId = String(value)
    router.push(`?sessionId=${sessionId}`)
  }

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
    <div className="space-y-6">
      {/* Session selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner une séance</CardTitle>
          <CardDescription>Choisissez une séance pour voir et gérer les présences</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId ?? ''} onValueChange={handleSessionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choisir une séance...">
                {selectedSessionLabel || 'Choisir une séance...'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-full min-w-80">
              {sessionOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {format(new Date(option.date), 'EEE d MMM', { locale: fr })} • {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Session details */}
      {sessionData && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle>{sessionData.module.title}</CardTitle>
                <CardDescription className="mt-1">
                  {sessionData.module.formation.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Session info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg text-sm">
              <div>
                <p className="text-muted-foreground">Moniteur</p>
                <p className="font-medium">{sessionData.module.trainer?.user.name ?? '—'}</p>
              </div>
              {sessionData.room && (
                <div>
                  <p className="text-muted-foreground">Salle</p>
                  <p className="font-medium">{sessionData.room.name}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Inscrits</p>
                <p className="font-medium">{sessionData.module.enrollments.length} étudiant(s)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Présences</p>
                <p className="font-medium">
                  {sessionData.attendances.filter((a) => a.status === 'PRESENT').length} présent(s)
                </p>
              </div>
            </div>

            {/* Attendance list */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Présences</h4>
              {sessionData.module.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun étudiant inscrit à cette séance.
                </p>
              ) : (
                <div className="space-y-2">
                  {sessionData.module.enrollments.map((enrollment) => {
                    const attendance = sessionData.attendances.find(
                      (a) =>
                        a.moduleEnrollmentId ===
                        `${enrollment.formationEnrollmentId}-${enrollment.userId}`
                    )

                    const status = (attendance?.status ?? 'ABSENT') as AttendanceStatus
                    const statusCfg = attendanceStatusConfig[status]

                    return (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{enrollment.user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {enrollment.user.email}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 text-xs ${statusCfg.className}`}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Info box */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <p>
                <strong>Note :</strong> Utilisez la page Présences pour les moniteurs pour modifier le
                statut de présence.
              </p>
            </div>
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
