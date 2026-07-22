'use client'

import { useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { TrainingSessionListRow } from '@/app/actions/training-sessions'
import type { TrainingSessionStatus } from '@prisma/client'

const STATUS_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'OPEN',      label: 'Ouvertes' },
  { key: 'STARTED',   label: 'En cours' },
  { key: 'DRAFT',     label: 'Brouillons' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'CANCELLED', label: 'Annulées' },
] as const

type TabKey = typeof STATUS_TABS[number]['key']

const STATUS_CONFIG: Record<TrainingSessionStatus, { dot: string; label: string }> = {
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon' },
  OPEN:      { dot: 'bg-emerald-500',      label: 'Ouverte' },
  STARTED:   { dot: 'bg-blue-500',         label: 'En cours' },
  COMPLETED: { dot: 'bg-muted-foreground', label: 'Terminée' },
  CANCELLED: { dot: 'bg-red-500',          label: 'Annulée' },
}

const NIVEAU_LABELS: Record<string, string> = {
  START:  'MIA Bronze',
  PRO:    'MIA Argent',
  EXPERT: 'MIA Or',
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
}

interface SessionsClientProps {
  sessions: TrainingSessionListRow[]
  counts: Record<string, number>
  search: string
  activeTab: TabKey | TrainingSessionStatus
}

export default function SessionsClient({ sessions, counts, search: initialSearch, activeTab }: SessionsClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status tabs */}
        <div className="flex gap-0.5 flex-wrap">
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher une session…"
            className="pl-8 w-52"
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
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
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                        <span className="text-sm">{label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums text-sm">
                      {session.enrollmentCount + session.inscriptionCount} / {session.maxStudents}
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
    </>
  )
}
