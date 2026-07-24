'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, ChevronDown, Pencil } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { TrainingSessionListRow } from '@/app/actions/training-sessions'
import { updateTrainingSessionStatus } from '@/app/actions/training-sessions'
import type { TrainingSessionStatus } from '@prisma/client'
import CreateSessionFromListDialog from './create-session-from-list-dialog'
import EditTrainingSessionDialog from './edit-training-session-dialog'

const STATUS_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'OPEN',      label: 'Ouvertes' },
  { key: 'STARTED',   label: 'En cours' },
  { key: 'DRAFT',     label: 'Brouillons' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
] as const

type TabKey = typeof STATUS_TABS[number]['key']

const STATUS_CONFIG: Record<TrainingSessionStatus, { dot: string; label: string; badge: string }> = {
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  OPEN:      { dot: 'bg-emerald-500',      label: 'Ouverte',   badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  STARTED:   { dot: 'bg-blue-500',         label: 'En cours',  badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { dot: 'bg-muted-foreground', label: 'Terminée',  badge: 'bg-muted text-muted-foreground' },
  CANCELLED: { dot: 'bg-red-500',          label: 'Annulée',   badge: 'bg-red-50 text-red-700 border-red-200' },
}

const STATUS_ORDER: TrainingSessionStatus[] = ['DRAFT', 'OPEN', 'STARTED', 'COMPLETED', 'CANCELLED']

const NIVEAU_LABELS: Record<string, string> = {
  START:  'MIA Bronze',
  PRO:    'MIA Argent',
  EXPERT: 'MIA Or',
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

interface Formation { id: string; title: string }
interface Trainer   { id: string; name: string }

interface SessionsClientProps {
  sessions:   TrainingSessionListRow[]
  counts:     Record<string, number>
  search:     string
  activeTab:  TabKey | TrainingSessionStatus
  formations: Formation[]
  trainers:   Trainer[]
}

export default function SessionsClient({ sessions: initialSessions, counts, search: initialSearch, activeTab, formations, trainers }: SessionsClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sessions, setSessions] = useState(initialSessions)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<TrainingSessionListRow | null>(null)
  const [, startTransition] = useTransition()

  // Sync when server re-renders with new data (e.g. after CreateSessionFromListDialog router.refresh())
  useEffect(() => { setSessions(initialSessions) }, [initialSessions])

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k)
        else next.set(k, v)
      })
      router.push(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router]
  )

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || null })
    }, 300)
  }

  function handleTabChange(tab: TabKey) {
    updateParams({ status: tab === 'all' ? null : tab, search: null })
  }

  function handleStatusChange(id: string, status: TrainingSessionStatus) {
    setUpdatingId(id)
    startTransition(async () => {
      await updateTrainingSessionStatus(id, status)
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
      setUpdatingId(null)
    })
  }

  function handleUpdated(id: string, patch: Partial<TrainingSessionListRow>) {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status tabs */}
        <div className="flex gap-0.5 flex-wrap items-center">
          {STATUS_TABS.map(({ key, label }) => {
            const count    = counts[key] ?? 0
            const isActive = activeTab === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {label}
                {key !== 'all' && count > 0 && (
                  <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ring-1 ring-border">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search + Create */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              defaultValue={initialSearch}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher une session…"
              className="pl-8 w-52"
            />
          </div>
          <CreateSessionFromListDialog
            formations={formations}
            trainers={trainers}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-5 text-xs">Session</TableHead>
              <TableHead className="px-5 text-xs">Formation</TableHead>
              <TableHead className="px-5 text-xs">Formateur</TableHead>
              <TableHead className="px-5 text-xs">Niveau</TableHead>
              <TableHead className="px-5 text-xs">Début</TableHead>
              <TableHead className="px-5 text-xs">Fin</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-right text-xs">Inscrits</TableHead>
              <TableHead className="px-3 text-xs w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch
                    ? `Aucune session ne correspond à "${initialSearch}".`
                    : 'Aucune session pour l\'instant.'}
                </TableCell>
              </TableRow>
            ) : (
              sessions.map(session => {
                const { dot, label } = STATUS_CONFIG[session.status]
                return (
                  <TableRow key={session.id}>
                    <TableCell className="px-5 py-4 font-medium max-w-48">
                      <span className="line-clamp-2 whitespace-normal leading-snug">{session.title}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground max-w-44">
                      <Link
                        href={`/admin/formations/${session.formationId}`}
                        className="hover:text-foreground hover:underline transition-colors line-clamp-1"
                        onClick={e => e.stopPropagation()}
                      >
                        {session.formationTitle}
                      </Link>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground">
                      {session.trainerName ?? <span className="italic text-muted-foreground/50">Non assigné</span>}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {session.niveau ? (
                        <Badge variant="outline" className="text-[11px]">
                          {NIVEAU_LABELS[session.niveau]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground tabular-nums">
                      {formatDate(session.startDate)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-muted-foreground tabular-nums">
                      {formatDate(session.endDate)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              disabled={updatingId === session.id}
                              aria-label={`Statut : ${label}`}
                              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60 hover:bg-muted transition-colors"
                            />
                          }
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
                          {label}
                          <ChevronDown className="h-3 w-3 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {STATUS_ORDER.filter(st => st !== session.status).map(st => (
                            <DropdownMenuItem key={st} onClick={() => handleStatusChange(session.id, st)}>
                              <span className={cn('mr-2 h-1.5 w-1.5 rounded-full', STATUS_CONFIG[st].dot)} />
                              {STATUS_CONFIG[st].label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums text-sm">
                      {session.enrollmentCount + session.inscriptionCount} / {session.maxStudents}
                    </TableCell>
                    <TableCell className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setEditingSession(session)}
                        aria-label="Modifier la session"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        <div className="border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {editingSession && (
        <EditTrainingSessionDialog
          session={editingSession}
          trainers={trainers}
          open={!!editingSession}
          onClose={() => setEditingSession(null)}
          onUpdated={patch => {
            handleUpdated(editingSession.id, patch)
            setEditingSession(null)
          }}
        />
      )}
    </>
  )
}
