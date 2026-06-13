'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleStatus } from '@prisma/client'
import type { RecentModuleRow } from '@/app/actions/dashboard'

const statusConfig: Record<ModuleStatus, { dot: string; label: string }> = {
  PUBLISHED: { dot: 'bg-emerald-500',      label: 'Publié' },
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon' },
  ARCHIVED:  { dot: 'bg-muted-foreground', label: 'Archivé' },
  COMPLETED: { dot: 'bg-blue-500',         label: 'Terminé' },
}

const PAGE_SIZE = 5

export default function ModulesTable({ modules }: { modules: RecentModuleRow[] }) {
  const router = useRouter()
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(modules.length / PAGE_SIZE))
  const paginated  = modules.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Modules récents</h2>
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/formations')}>
          Voir les formations
        </Button>
      </div>

      {/* Table card */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Module</TableHead>
              <TableHead className="px-5 text-xs">Catégorie</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-right text-xs">Élèves</TableHead>
              <TableHead className="px-5 text-xs">Moniteur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Aucun module pour l&apos;instant.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((module, i) => {
                const { dot, label } = statusConfig[module.status]
                return (
                  <TableRow key={module.id}>
                    <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                      {(page - 1) * PAGE_SIZE + i + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium">{module.title}</TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{module.categoryName}</TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                        <span>{label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums">{module.enrollmentCount}</TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{module.trainerName}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {modules.length} module{modules.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(1)} disabled={page === 1} aria-label="Première page">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => p - 1)} disabled={page === 1} aria-label="Page précédente">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(p => p + 1)} disabled={page === totalPages} aria-label="Page suivante">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Dernière page">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
