'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { FormationsResult } from '@/app/actions/formations'
import { deleteFormation } from '@/app/actions/formations'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, Search, LayoutList,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import CreateFormationDialog from './create-formation-dialog'
import FormationDetailSheet from './formation-detail-sheet'
import type { FormationStatus } from '@prisma/client'

const STATUS_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'PUBLISHED', label: 'Publiées' },
  { key: 'DRAFT',     label: 'Brouillons' },
  { key: 'COMPLETED', label: 'Terminées' },
  { key: 'ARCHIVED',  label: 'Archivées' },
] as const

type TabKey = typeof STATUS_TABS[number]['key']

const statusConfig: Record<FormationStatus, { dot: string; label: string }> = {
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon' },
  PUBLISHED: { dot: 'bg-emerald-500',      label: 'Publiée' },
  ARCHIVED:  { dot: 'bg-muted-foreground', label: 'Archivée' },
  COMPLETED: { dot: 'bg-blue-500',         label: 'Terminée' },
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

interface Category { id: string; name: string }

interface FormationsClientProps {
  data: FormationsResult
  search: string
  activeTab: TabKey
  categories: Category[]
}

export default function FormationsClient({
  data, search: initialSearch, activeTab, categories,
}: FormationsClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const [selectedFormationId, setSelectedFormationId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteFormation(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const { formations, total, page, pageSize, totalPages, counts } = data

  const tabCounts: Record<TabKey, number> = {
    all:       counts.all,
    PUBLISHED: counts.PUBLISHED,
    DRAFT:     counts.DRAFT,
    COMPLETED: counts.COMPLETED,
    ARCHIVED:  counts.ARCHIVED,
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status tabs */}
        <div className="flex gap-0.5 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => {
            const count    = tabCounts[key]
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

        {/* Search + actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              defaultValue={initialSearch}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher une formation…"
              className="pl-8 w-52"
            />
          </div>
          <CreateFormationDialog categories={categories} />
        </div>
      </div>

      {/* Table card */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Formation</TableHead>
              <TableHead className="px-5 text-xs">Catégorie</TableHead>
              <TableHead className="px-5 text-xs">Type</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-right text-xs">Inscrits</TableHead>
              <TableHead className="px-5 text-right text-xs">Modules</TableHead>
              <TableHead className="px-5 text-xs">Début</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {formations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch
                    ? `Aucune formation ne correspond à "${initialSearch}".`
                    : activeTab !== 'all'
                      ? `Aucune formation ${statusConfig[activeTab as FormationStatus]?.label.toLowerCase() ?? ''} pour l'instant.`
                      : 'Aucune formation pour l\'instant.'}
                </TableCell>
              </TableRow>
            ) : (
              formations.map((formation, i) => {
                const { dot, label } = statusConfig[formation.status]
                return (
                  <TableRow
                    key={formation.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedFormationId(formation.id)}
                  >
                    <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + i + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium max-w-60">
                      <span className="line-clamp-1">{formation.title}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{formation.categoryName}</TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary" className="text-[11px]">
                        {formation.type === 'PRESENTIAL' ? 'Présentiel' : 'À distance'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                        <span>{label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums">
                      {formation.enrollmentCount} / {formation.maxStudents}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                      {formation.moduleCount}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{'—'}</TableCell>
                    <TableCell
                      className="px-5 py-4"
                      onClick={e => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              aria-label="Actions sur la ligne"
                              className="cursor-pointer rounded p-1 text-muted-foreground outline-none hover:text-foreground"
                            />
                          }
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedFormationId(formation.id)}>
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.location.href = `/admin/formations/${formation.id}`}>
                            <LayoutList className="h-4 w-4 mr-2" />
                            Gérer les modules
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget({ id: formation.id, title: formation.title })}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            {total} formation{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lignes par page</span>
              <span className="text-xs font-medium">{pageSize}</span>
            </div>
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

      {/* Detail sheet */}
      <FormationDetailSheet
        formationId={selectedFormationId}
        onClose={() => setSelectedFormationId(null)}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la formation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.title}</strong> ? Toutes les inscriptions
              et cours associés seront également supprimés. Cette action est irréversible.
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
