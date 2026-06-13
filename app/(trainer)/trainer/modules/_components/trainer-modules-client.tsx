'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TrainerModulesResult } from '@/app/actions/trainer-dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, Search, BookOpen, Car, ClipboardCheck, Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModuleStatus, ModuleType } from '@prisma/client'
import ModuleMaterialsSection from './module-materials-section'

type TabKey = ModuleStatus | 'all'

const STATUS_TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'Tous' },
  { key: 'PUBLISHED', label: 'Publiés' },
  { key: 'DRAFT',     label: 'Brouillons' },
  { key: 'COMPLETED', label: 'Terminés' },
  { key: 'ARCHIVED',  label: 'Archivés' },
]

const statusConfig: Record<ModuleStatus, { dot: string; label: string }> = {
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon' },
  PUBLISHED: { dot: 'bg-emerald-500',      label: 'Publié' },
  ARCHIVED:  { dot: 'bg-muted-foreground', label: 'Archivé' },
  COMPLETED: { dot: 'bg-blue-500',         label: 'Terminé' },
}

const typeConfig: Record<ModuleType, { label: string; icon: React.ReactNode; classes: string }> = {
  THEORY:     { label: 'Théorie',    icon: <BookOpen className="h-3 w-3" />,        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  PRACTICAL:  { label: 'Conduite',   icon: <Car className="h-3 w-3" />,             classes: 'bg-green-50 text-green-700 border-green-200' },
  ASSESSMENT: { label: 'Évaluation', icon: <ClipboardCheck className="h-3 w-3" />, classes: 'bg-purple-50 text-purple-700 border-purple-200' },
}

interface TrainerModulesClientProps {
  data: TrainerModulesResult
  search: string
  activeTab: TabKey
}

export default function TrainerModulesClient({
  data,
  search: initialSearch,
  activeTab,
}: TrainerModulesClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sheetModule, setSheetModule] = useState<TrainerModulesResult['modules'][number] | null>(null)

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

  const { modules, total, page, pageSize, totalPages, counts } = data

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

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher des modules…"
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
              <TableHead className="px-5 text-xs">Module</TableHead>
              <TableHead className="px-5 text-xs">Formation</TableHead>
              <TableHead className="px-5 text-xs">Type</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-right text-xs">Étudiants</TableHead>
              <TableHead className="px-5 text-right text-xs">Durée</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Aucun module trouvé.
                </TableCell>
              </TableRow>
            ) : (
              modules.map((module, i) => {
                const { dot, label: statusLabel } = statusConfig[module.status]
                const { label: typeLabel, icon: typeIcon, classes: typeClasses } = typeConfig[module.type]
                return (
                  <TableRow
                    key={module.id}
                    className="cursor-pointer"
                    onClick={() => setSheetModule(module)}
                  >
                    <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                      {(page - 1) * pageSize + i + 1}
                    </TableCell>
                    <TableCell className="px-5 py-4 font-medium max-w-55">
                      <span className="line-clamp-1">{module.title}</span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground max-w-40">
                      <span className="line-clamp-1">
                        {module.formationTitle ?? <span className="italic text-muted-foreground/60">—</span>}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
                        typeClasses
                      )}>
                        {typeIcon}
                        {typeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                        <span className="text-sm">{statusLabel}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums">
                      {module.enrollmentCount}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right text-muted-foreground">
                      {module.duration > 0 ? (
                        <span className="inline-flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" />
                          {module.duration} min
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="px-5 py-4" onClick={e => e.stopPropagation()}>
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
                          <DropdownMenuItem onClick={() => setSheetModule(module)}>
                            Voir les détails
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
            {total} module{total !== 1 ? 's' : ''}
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

      {/* Detail sheet */}
      <Sheet open={!!sheetModule} onOpenChange={open => { if (!open) setSheetModule(null) }}>
        <SheetContent>
          {sheetModule && (
            <>
              <SheetHeader>
                <SheetTitle className="line-clamp-2">{sheetModule.title}</SheetTitle>
                <SheetDescription>
                  {sheetModule.formationTitle ?? 'Sans formation'}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4 px-4">
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Statut</p>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', statusConfig[sheetModule.status].dot)} />
                    <span className="text-sm">{statusConfig[sheetModule.status].label}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Type</p>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium w-fit',
                    typeConfig[sheetModule.type].classes
                  )}>
                    {typeConfig[sheetModule.type].icon}
                    {typeConfig[sheetModule.type].label}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Étudiants inscrits</p>
                  <p className="text-sm">{sheetModule.enrollmentCount} étudiant{sheetModule.enrollmentCount !== 1 ? 's' : ''}</p>
                </div>
                {sheetModule.duration > 0 && (
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Durée</p>
                    <p className="text-sm">{sheetModule.duration} minutes</p>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ordre</p>
                  <p className="text-sm">Module #{sheetModule.orderIndex + 1}</p>
                </div>
                <div className="border-t pt-4">
                  <ModuleMaterialsSection moduleId={sheetModule.id} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
