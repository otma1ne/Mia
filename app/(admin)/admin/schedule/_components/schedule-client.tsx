'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  format, addWeeks, subWeeks, addMonths, subMonths,
  startOfWeek, endOfWeek, eachDayOfInterval,
  isSameDay, isToday, parseISO,
} from 'date-fns'
import type { SessionEvent } from '@/app/actions/schedule'
import { deleteSession, getSessions } from '@/app/actions/schedule'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronLeft, ChevronRight, CalendarDays,
  List, Clock, MapPin, User, MoreVertical, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CreateSessionDialog from './create-session-dialog'

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 07:00 – 19:00
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Colour pool — cycles by moduleId hash
const COURSE_COLOURS = [
  { chip: 'bg-indigo-100 text-indigo-800 border-indigo-200',  accent: 'border-l-indigo-400',  dot: 'bg-indigo-400'  },
  { chip: 'bg-emerald-100 text-emerald-800 border-emerald-200', accent: 'border-l-emerald-400', dot: 'bg-emerald-400' },
  { chip: 'bg-amber-100 text-amber-800 border-amber-200',     accent: 'border-l-amber-400',   dot: 'bg-amber-400'   },
  { chip: 'bg-rose-100 text-rose-800 border-rose-200',        accent: 'border-l-rose-400',    dot: 'bg-rose-400'    },
  { chip: 'bg-violet-100 text-violet-800 border-violet-200',  accent: 'border-l-violet-400',  dot: 'bg-violet-400'  },
  { chip: 'bg-sky-100 text-sky-800 border-sky-200',           accent: 'border-l-sky-400',     dot: 'bg-sky-400'     },
  { chip: 'bg-orange-100 text-orange-800 border-orange-200',  accent: 'border-l-orange-400',  dot: 'bg-orange-400'  },
  { chip: 'bg-teal-100 text-teal-800 border-teal-200',        accent: 'border-l-teal-400',    dot: 'bg-teal-400'    },
]

function moduleColour(moduleId: string) {
  let hash = 0
  for (const c of moduleId) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return COURSE_COLOURS[Math.abs(hash) % COURSE_COLOURS.length]
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToPx(minutes: number, pxPerHour = 64) {
  return (minutes / 60) * pxPerHour
}

interface Module  { id: string; title: string }
interface Room    { id: string; name: string; capacity: number }
interface Trainer { id: string; user: { name: string } }

interface ScheduleClientProps {
  initialSessions: SessionEvent[]
  refDateStr: string       // ISO string — the "anchor" week
  view: 'week' | 'list'
  modules: Module[]
  rooms: Room[]
  trainers: Trainer[]
}

export default function ScheduleClient({
  initialSessions,
  refDateStr,
  view: initialView,
  modules,
  rooms,
  trainers,
}: ScheduleClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const [sessions, setSessions]   = useState<SessionEvent[]>(initialSessions)
  const [view, setView]           = useState<'week' | 'list'>(initialView)
  const [deleteTarget, setDeleteTarget] = useState<SessionEvent | null>(null)
  const [isDeleting, setIsDeleting]     = useState(false)
  const [, startTransition]             = useTransition()

  const refDate = new Date(refDateStr)
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(refDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  function navigate(newRef: Date) {
    const next = new URLSearchParams(params.toString())
    next.set('ref', format(newRef, 'yyyy-MM-dd'))
    next.set('view', view)
    router.push(`${pathname}?${next.toString()}`)
  }

  function switchView(v: 'week' | 'list') {
    setView(v)
    const next = new URLSearchParams(params.toString())
    next.set('view', v)
    router.push(`${pathname}?${next.toString()}`)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteSession(deleteTarget.id)
    setSessions(prev => prev.filter(s => s.id !== deleteTarget.id))
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  // After creating a session, re-fetch the current week
  function handleCreated() {
    startTransition(async () => {
      const fresh = await getSessions({ from: weekStart, to: weekEnd })
      setSessions(fresh)
    })
  }

  const sessionsThisWeek = sessions.filter(s =>
    new Date(s.date) >= weekStart && new Date(s.date) <= weekEnd
  )

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => navigate(subWeeks(refDate, 1))} aria-label="Semaine précédente">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(new Date())}>
            Aujourd&apos;hui
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8"
            onClick={() => navigate(addWeeks(refDate, 1))} aria-label="Semaine suivante">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-1">
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => switchView('week')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
                view === 'week'
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Semaine
            </button>
            <button
              type="button"
              onClick={() => switchView('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors border-l',
                view === 'list'
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted/50'
              )}
            >
              <List className="h-3.5 w-3.5" />
              Liste
            </button>
          </div>

          <CreateSessionDialog modules={modules} rooms={rooms} trainers={trainers} onCreated={handleCreated} />
        </div>
      </div>

      {/* Week view */}
      {view === 'week' && (
        <Card className="gap-0 py-0 overflow-hidden">
          {/* Day headers */}
          <div className="grid border-b" style={{ gridTemplateColumns: '3rem 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
            <div className="border-r" /> {/* time gutter */}
            {days.map(day => (
              <div
                key={day.toISOString()}
                className={cn(
                  'py-2 px-3 border-r last:border-r-0',
                  isToday(day) && 'bg-primary/5'
                )}
              >
                <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                <p className={cn(
                  'text-sm font-semibold mt-0.5',
                  isToday(day) && 'text-primary'
                )}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="overflow-y-auto max-h-[600px]">
            <div className="relative" style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
              {/* Background: hour rows */}
              {HOURS.map(hour => (
                <div key={hour} className="contents">
                  <div className="border-r border-b h-16 flex items-start pt-1 px-1">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  </div>
                  {days.map(day => (
                    <div key={day.toISOString()} className={cn(
                      'border-r border-b last:border-r-0 h-16',
                      isToday(day) && 'bg-primary/[0.02]'
                    )} />
                  ))}
                </div>
              ))}

              {/* Event overlay — one relative column per day, spans all rows */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ display: 'grid', gridTemplateColumns: '3rem 1fr 1fr 1fr 1fr 1fr 1fr 1fr' }}
              >
                <div /> {/* gutter spacer */}
                {days.map(day => {
                  const daySessions = sessionsThisWeek.filter(s => isSameDay(new Date(s.date), day))
                  return (
                    <div key={day.toISOString()} className="relative">
                      {daySessions.map(session => {
                        const startMin = timeToMinutes(session.startTime) - timeToMinutes('07:00')
                        const duration = timeToMinutes(session.endTime) - timeToMinutes(session.startTime)
                        const top      = minutesToPx(Math.max(0, startMin))
                        const height   = Math.max(minutesToPx(duration), 24)
                        const colour   = moduleColour(session.moduleId)
                        return (
                          <div
                            key={session.id}
                            className={cn(
                              'absolute rounded border p-1.5 cursor-pointer overflow-hidden text-xs leading-snug pointer-events-auto',
                              colour.chip
                            )}
                            style={{ top, height, left: 2, right: 2 }}
                            onClick={() => setDeleteTarget(session)}
                          >
                            <p className="font-semibold truncate">{session.moduleTitle}</p>
                            <p className="opacity-75 truncate">{session.startTime}–{session.endTime}</p>
                            {session.roomName && (
                              <p className="opacity-60 truncate">{session.roomName}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="flex flex-col gap-3">
          {sessionsThisWeek.length === 0 ? (
            <Card className="py-12 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Aucune séance prévue cette semaine.</p>
            </Card>
          ) : (
            days.map(day => {
              const daySessions = sessionsThisWeek.filter(s => isSameDay(new Date(s.date), day))
              if (daySessions.length === 0) return null
              return (
                <div key={day.toISOString()} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-semibold',
                      isToday(day) ? 'text-primary' : 'text-foreground'
                    )}>
                      {format(day, 'EEEE, MMMM d')}
                    </span>
                    {isToday(day) && <Badge variant="secondary" className="text-[10px]">Aujourd&apos;hui</Badge>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySessions.map(session => {
                      const colour = moduleColour(session.moduleId)
                      return (
                        <div key={session.id} className={cn(
                          'flex items-center gap-4 px-4 py-3 rounded-xl border-l-4 ring-1 ring-foreground/10 bg-card',
                          colour.accent
                        )}>
                          <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', colour.dot)} />

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{session.moduleTitle}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {session.startTime} – {session.endTime}
                              </span>
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {session.trainerName}
                              </span>
                              {session.roomName && (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  {session.roomName}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium border', colour.chip)}>
                              {session.enrollmentCount} élève{session.enrollmentCount !== 1 ? 's' : ''}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <button
                                    type="button"
                                    aria-label="Actions sur la séance"
                                    className="cursor-pointer rounded p-1 text-muted-foreground outline-none hover:text-foreground"
                                  />
                                }
                              >
                                <MoreVertical className="h-4 w-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteTarget(session)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Supprimer la séance</DialogTitle>
            <DialogDescription>
              Supprimer la séance <strong>{deleteTarget?.moduleTitle}</strong> du{' '}
              {deleteTarget && format(new Date(deleteTarget.date), 'MMMM d')} à{' '}
              {deleteTarget?.startTime} ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
