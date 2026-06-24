'use client'

import { useState, useTransition } from 'react'
import type { ModuleRow } from '@/app/actions/modules'
import { deleteModule, reorderModules, updateModuleStatus } from '@/app/actions/modules'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronUp, ChevronDown, MoreVertical, Plus,
  BookOpen, Car, ClipboardCheck, Video, Clock,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ModuleStatus, ModuleType } from '@prisma/client'
import CreateModuleDialog from './create-module-dialog'
import EditModuleSheet from './edit-module-sheet'
import ModuleMaterialsDialog from './module-materials-dialog'

// ─────────────────────────────────────────
// Type badges config
// ─────────────────────────────────────────

const typeConfig: Record<ModuleType, { label: string; icon: React.ReactNode; classes: string }> = {
  THEORY:     { label: 'Théorie',    icon: <BookOpen className="h-3.5 w-3.5" />,        classes: 'bg-blue-50 text-blue-700 border-blue-200' },
  PRACTICAL:  { label: 'Conduite',   icon: <Car className="h-3.5 w-3.5" />,             classes: 'bg-green-50 text-green-700 border-green-200' },
  ASSESSMENT: { label: 'Évaluation', icon: <ClipboardCheck className="h-3.5 w-3.5" />, classes: 'bg-purple-50 text-purple-700 border-purple-200' },
}

const statusConfig: Record<ModuleStatus, { dot: string; label: string }> = {
  DRAFT:     { dot: 'bg-amber-400',        label: 'Brouillon' },
  PUBLISHED: { dot: 'bg-emerald-500',      label: 'Publié' },
  ARCHIVED:  { dot: 'bg-muted-foreground', label: 'Archivé' },
  COMPLETED: { dot: 'bg-blue-500',         label: 'Terminé' },
}

// ─────────────────────────────────────────
// Trainer option type
// ─────────────────────────────────────────

interface ModulesListProps {
  formationId: string
  initialModules: ModuleRow[]
  trainers?: unknown[]
}

export default function ModulesList({ formationId, initialModules }: ModulesListProps) {
  const [modules, setModules] = useState<ModuleRow[]>(initialModules)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [editTarget, setEditTarget] = useState<ModuleRow | null>(null)
  const [materialsTarget, setMaterialsTarget] = useState<ModuleRow | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Move up/down ───────────────────────────────────────────────────

  function move(index: number, direction: 'up' | 'down') {
    const next = [...modules]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    setModules(next)
    startTransition(async () => {
      await reorderModules(formationId, next.map(m => m.id))
    })
  }

  // ── Delete ─────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteModule(deleteTarget.id)
    setModules(prev => prev.filter(m => m.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  // ── Status toggle ──────────────────────────────────────────────────

  function togglePublish(module: ModuleRow) {
    const next: ModuleStatus = module.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
    setModules(prev => prev.map(m => m.id === module.id ? { ...m, status: next } : m))
    startTransition(async () => {
      await updateModuleStatus(module.id, next)
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Modules</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {modules.length} module{modules.length !== 1 ? 's' : ''} — parcours séquentiel
          </p>
        </div>
        <CreateModuleDialog formationId={formationId} onCreated={m => setModules(prev => [...prev, m])} />
      </div>

      {/* Empty state */}
      {modules.length === 0 && (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          Aucun module. Cliquez sur "Ajouter un module" pour commencer.
        </Card>
      )}

      {/* Module rows */}
      <div className="space-y-2">
        {modules.map((module, idx) => {
          const { label: typeLabel, icon: typeIcon, classes: typeClasses } = typeConfig[module.type]
          const { dot, label: statusLabel } = statusConfig[module.status]

          return (
            <Card key={module.id} className="p-4">
              <div className="flex items-center gap-4">
                {/* Order badge + reorder buttons */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost" size="icon" className="h-5 w-5"
                    disabled={idx === 0 || isPending}
                    onClick={() => move(idx, 'up')}
                    aria-label="Monter"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums w-6 text-center">
                    #{idx + 1}
                  </span>
                  <Button
                    variant="ghost" size="icon" className="h-5 w-5"
                    disabled={idx === modules.length - 1 || isPending}
                    onClick={() => move(idx, 'down')}
                    aria-label="Descendre"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Type badge */}
                <span className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0',
                  typeClasses
                )}>
                  {typeIcon}
                  {typeLabel}
                </span>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{module.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{module.description}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                  {module.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {module.duration} min
                    </span>
                  )}
                  {module.videoUrl && (
                    <span className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      Vidéo
                    </span>
                  )}
                  {/* trainer name removed (field no longer on Module) */}
                </div>

                {/* Status dot */}
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs shrink-0">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                  {statusLabel}
                </span>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        aria-label="Actions"
                        className="cursor-pointer rounded p-1 text-muted-foreground outline-none hover:text-foreground shrink-0"
                      />
                    }
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditTarget(module)}>
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMaterialsTarget(module)}>
                      Gérer les ressources
                    </DropdownMenuItem>
                    {module.type === 'ASSESSMENT' && (
                      <DropdownMenuItem
                        render={
                          <Link href={`/admin/formations/${formationId}/modules/${module.id}/exam`} />
                        }
                      >
                        Gérer l&apos;examen
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => togglePublish(module)}>
                      {module.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeleteTarget({ id: module.id, title: module.title })}
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit sheet */}
      <EditModuleSheet
        module={editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={updated =>
          setModules(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))
        }
      />

      {/* Materials management dialog */}
      <ModuleMaterialsDialog
        module={materialsTarget}
        onClose={() => setMaterialsTarget(null)}
      />

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer le module</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.title}</strong> ?
              Les inscriptions et sessions associées seront également supprimées. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
