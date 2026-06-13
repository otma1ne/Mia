'use client'

import { useCallback, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { StudentEnrollmentsResult } from '@/app/actions/student-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Eye,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { EnrollmentStatus } from '@prisma/client'
// FormationType used via e.type from StudentEnrollmentRow

type TabKey = EnrollmentStatus | 'all'

const STATUS_TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'ACTIVE',    label: 'Actifs' },
  { key: 'COMPLETED', label: 'Terminés' },
  { key: 'DROPPED',   label: 'Abandonnés' },
]

const enrollmentStatusConfig: Record<EnrollmentStatus, { label: string; className: string }> = {
  ACTIVE:    { label: 'Actif',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  COMPLETED: { label: 'Terminé',   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  DROPPED:   { label: 'Abandonné', className: 'bg-red-50 text-red-700 border-red-200' },
  SUSPENDED: { label: 'Suspendu',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

interface StudentEnrollmentsClientProps {
  data: StudentEnrollmentsResult
  search: string
  activeTab: TabKey
}

export default function StudentEnrollmentsClient({
  data,
  search: initialSearch,
  activeTab,
}: StudentEnrollmentsClientProps) {
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
      updateParams({ search: value || null, page: null })
    }, 300)
  }

  function handleTabChange(tab: TabKey) {
    updateParams({ status: tab === 'all' ? null : tab, page: null, search: null })
  }

  const { enrollments, total, page, pageSize, totalPages } = data

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-0.5 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={cn(
                'flex cursor-pointer select-none items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeTab === key
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher des formations…"
            className="pl-8 w-48"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Formation</TableHead>
              <TableHead className="px-5 text-xs">Type</TableHead>
              <TableHead className="px-5 text-xs">Progression</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-xs">Inscrit le</TableHead>
              <TableHead className="px-5 text-xs" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch ? `Aucune inscription ne correspond à "${initialSearch}".` : 'Aucune inscription trouvée.'}
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((e, i) => {
                const statusCfg = enrollmentStatusConfig[e.status]
                return (
                  <TableRow key={e.id}>
                    <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + i + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium max-w-50">
                      <span className="line-clamp-1">{e.formationTitle}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">
                      {e.type === 'PRESENTIAL' ? 'Présentiel' : 'À distance'}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${e.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{e.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="outline" className={cn('text-[11px]', statusCfg.className)}>
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground text-sm">
                      {format(new Date(e.enrolledAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Link
                        href={`/student/formations/${e.formationId}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'h-7 gap-1 text-xs')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </Link>
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
            {total} inscription{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-6">
            <p className="text-xs text-muted-foreground">Page {page} sur {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: '1' })} disabled={page === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page - 1) })} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page + 1) })} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(totalPages) })} disabled={page === totalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  )
}
