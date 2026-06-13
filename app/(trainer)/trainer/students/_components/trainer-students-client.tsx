'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TrainerStudentsResult } from '@/app/actions/trainer-dashboard'
import { updateStudentProgress } from '@/app/actions/trainer-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Search, Pencil, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { EnrollmentStatus } from '@prisma/client'

const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE:    { label: 'Actif',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'Terminé',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  DROPPED:   { label: 'Abandonné', className: 'bg-red-50 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspendu',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const STATUS_OPTIONS: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED']

interface EditTarget {
  enrollmentId: string
  name: string
  moduleTitle: string
  progress: number
  status: EnrollmentStatus
}

interface TrainerStudentsClientProps {
  data: TrainerStudentsResult
  search: string
}

export default function TrainerStudentsClient({ data, search: initialSearch }: TrainerStudentsClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editProgress, setEditProgress] = useState(0)
  const [editStatus, setEditStatus]     = useState<EnrollmentStatus>('ACTIVE')
  const [saved, setSaved]               = useState(false)
  const [isPending, startTransition]    = useTransition()

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
      updateParams({ search: value || null, page: null })
    }, 300)
  }

  function openEdit(target: EditTarget) {
    setEditTarget(target)
    setEditProgress(target.progress)
    setEditStatus(target.status)
    setSaved(false)
  }

  function handleSave() {
    if (!editTarget) return
    startTransition(async () => {
      await updateStudentProgress(editTarget.enrollmentId, editProgress, editStatus)
      setSaved(true)
      setTimeout(() => {
        setEditTarget(null)
        setSaved(false)
      }, 1200)
    })
  }

  const { students, total, page, pageSize, totalPages } = data

  return (
    <>
      {/* Search */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher des étudiants ou des cours…"
            className="pl-8 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Nom</TableHead>
              <TableHead className="px-5 text-xs">E-mail</TableHead>
              <TableHead className="px-5 text-xs">Cours</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-xs">Progression</TableHead>
              <TableHead className="px-5 text-xs">Inscrit le</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch ? `Aucun étudiant ne correspond à "${initialSearch}".` : 'Aucun étudiant inscrit pour l\'instant.'}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, i) => {
                const statusCfg = enrollmentStatusConfig[student.enrollmentStatus as EnrollmentStatus]
                return (
                  <TableRow key={student.enrollmentId}>
                    <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + i + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium">{student.name}</TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="px-5 py-4 max-w-44">
                      <span className="line-clamp-1 text-sm">{student.moduleTitle}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="outline" className={cn('text-[11px]', statusCfg?.className)}>
                        {statusCfg?.label ?? student.enrollmentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <progress
                          value={student.progress}
                          max={100}
                          className="h-1.5 w-20 appearance-none overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary"
                        />
                        <span className="text-xs text-muted-foreground tabular-nums">{student.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground text-sm">
                      {format(new Date(student.enrolledAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <button
                        type="button"
                        aria-label="Modifier la progression"
                        onClick={() => openEdit({
                          enrollmentId: student.enrollmentId,
                          name: student.name,
                          moduleTitle: student.moduleTitle,
                          progress: student.progress,
                          status: student.enrollmentStatus as EnrollmentStatus,
                        })}
                        className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {total} étudiant{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-6">
            <p className="text-xs text-muted-foreground">Page {page} sur {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: '1' })} disabled={page === 1} aria-label="Première page">
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page - 1) })} disabled={page === 1} aria-label="Page précédente">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page + 1) })} disabled={page === totalPages} aria-label="Page suivante">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(totalPages) })} disabled={page === totalPages} aria-label="Dernière page">
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit progress dialog */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modifier la progression</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{editTarget?.name}</span>
              {' — '}{editTarget?.moduleTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Progression&nbsp;: <span className="text-primary tabular-nums">{editProgress}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={editProgress}
                onChange={e => setEditProgress(Number(e.target.value))}
                aria-label="Pourcentage de progression"
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Statut</label>
              <Select
                value={editStatus}
                onValueChange={v => setEditStatus((v ?? 'ACTIVE') as EnrollmentStatus)}
                labelItems={Object.fromEntries(STATUS_OPTIONS.map(s => [s, enrollmentStatusConfig[s].label]))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-48">
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s} label={enrollmentStatusConfig[s].label}>
                      {enrollmentStatusConfig[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
              {saved ? (
                <><Check className="h-4 w-4" /> Enregistré</>
              ) : isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
