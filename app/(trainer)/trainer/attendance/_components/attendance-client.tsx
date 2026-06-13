'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import type {
  TrainerSessionOption,
  SessionAttendanceData,
} from '@/app/actions/trainer-dashboard'
import { saveAttendance } from '@/app/actions/trainer-dashboard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Check, CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { AttendanceStatus } from '@prisma/client'

const STATUSES: { value: AttendanceStatus; label: string; colour: string }[] = [
  { value: 'PRESENT', label: 'Présent',  colour: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'ABSENT',  label: 'Absent',   colour: 'bg-red-500 text-white border-red-500' },
  { value: 'LATE',    label: 'En retard', colour: 'bg-amber-500 text-white border-amber-500' },
  { value: 'EXCUSED', label: 'Excusé',   colour: 'bg-blue-500 text-white border-blue-500' },
]

const INACTIVE_COLOUR = 'bg-background text-muted-foreground border-border hover:bg-muted'

interface AttendanceClientProps {
  sessionOptions: TrainerSessionOption[]
  selectedSessionId: string | null
  sessionData: SessionAttendanceData | null
}

export default function AttendanceClient({
  sessionOptions,
  selectedSessionId,
  sessionData,
}: AttendanceClientProps) {
  const router   = useRouter()
  const pathname = usePathname()

  const [records, setRecords] = useState<Record<string, AttendanceStatus>>(() => {
    if (!sessionData) return {}
    return Object.fromEntries(
      sessionData.students
        .filter(s => s.attendanceStatus)
        .map(s => [s.enrollmentId, s.attendanceStatus as AttendanceStatus])
    )
  })

  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSessionChange(id: unknown) {
    if (!id) return
    router.push(`${pathname}?sessionId=${String(id)}`)
    setRecords({})
    setSaved(false)
  }

  function setStatus(enrollmentId: string, status: AttendanceStatus) {
    setRecords(prev => ({ ...prev, [enrollmentId]: status }))
    setSaved(false)
  }

  function handleSave() {
    if (!selectedSessionId || !sessionData) return
    const recordList = sessionData.students.map(s => ({
      enrollmentId: s.enrollmentId,
      status: records[s.enrollmentId] ?? 'ABSENT',
    }))
    startTransition(async () => {
      await saveAttendance(selectedSessionId, recordList)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  const sessionLabelItems = Object.fromEntries(
    sessionOptions.map(s => [
      s.id,
      `${s.moduleTitle} — ${format(new Date(s.date), 'MMM d, yyyy')} ${s.startTime}`,
    ])
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Session selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-2 max-w-sm">
            <label className="text-sm font-medium">Sélectionner une séance</label>
            <Select value={selectedSessionId ?? ''} onValueChange={handleSessionChange} labelItems={sessionLabelItems}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une séance…" />
              </SelectTrigger>
              <SelectContent className="min-w-96">
                {sessionOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Aucune séance disponible.</div>
                ) : (
                  sessionOptions.map(s => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      label={sessionLabelItems[s.id]}
                    >
                      {s.moduleTitle} — {format(new Date(s.date), 'MMM d, yyyy')} {s.startTime}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance table */}
      {sessionData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">{sessionData.moduleTitle}</CardTitle>
            <CardDescription className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(new Date(sessionData.date), 'EEEE, MMMM d, yyyy')}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {sessionData.startTime} – {sessionData.endTime}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-5 text-xs">#</TableHead>
                  <TableHead className="px-5 text-xs">Étudiant</TableHead>
                  <TableHead className="px-5 text-xs">E-mail</TableHead>
                  <TableHead className="px-5 text-xs">Présence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionData.students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                      Aucun étudiant inscrit dans ce cours.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessionData.students.map((student, i) => {
                    const current = records[student.enrollmentId]
                    return (
                      <TableRow key={student.enrollmentId}>
                        <TableCell className="px-5 py-3 text-muted-foreground tabular-nums">{i + 1}</TableCell>
                        <TableCell className="px-5 py-3 font-medium">{student.name}</TableCell>
                        <TableCell className="px-5 py-3 text-muted-foreground">{student.email}</TableCell>
                        <TableCell className="px-5 py-3">
                          <div className="flex gap-1.5">
                            {STATUSES.map(({ value, label, colour }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setStatus(student.enrollmentId, value)}
                                className={cn(
                                  'rounded border px-2.5 py-1 text-xs font-medium transition-colors',
                                  current === value ? colour : INACTIVE_COLOUR
                                )}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            <div className="flex justify-end px-5 pt-4 pb-2">
              <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
                {saved ? (
                  <><Check className="h-4 w-4" /> Enregistré</>
                ) : isPending ? 'Enregistrement…' : 'Enregistrer la présence'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedSessionId && (
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sélectionnez une séance ci-dessus pour marquer la présence.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
