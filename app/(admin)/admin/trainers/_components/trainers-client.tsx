'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { TrainersResult } from '@/app/actions/trainers'
import { deleteTrainer } from '@/app/actions/trainers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Search,
  Star,
} from 'lucide-react'
import CreateTrainerDialog from './create-trainer-dialog'
import TrainerDetailSheet from './trainer-detail-sheet'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(date))
}

interface TrainersClientProps {
  data: TrainersResult
  search: string
  categories: { id: string; name: string }[]
}

export default function TrainersClient({ data, search: initialSearch, categories }: TrainersClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget]           = useState<{ userId: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting]               = useState(false)

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

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteTrainer(deleteTarget.userId)
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const { trainers, total, page, pageSize, totalPages } = data

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher des formateurs…"
            className="pl-8"
          />
        </div>
        <CreateTrainerDialog categories={categories} />
      </div>

      {/* Table card */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Formateur</TableHead>
              <TableHead className="px-5 text-xs">E-mail</TableHead>
              <TableHead className="px-5 text-xs">Spécialisations</TableHead>
              <TableHead className="px-5 text-right text-xs">Cours</TableHead>
              <TableHead className="px-5 text-right text-xs">Note</TableHead>
              <TableHead className="px-5 text-xs">Inscrit le</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch ? `Aucun formateur ne correspond à "${initialSearch}".` : 'Aucun formateur pour l\'instant.'}
                </TableCell>
              </TableRow>
            ) : (
              trainers.map((trainer, i) => (
                <TableRow
                  key={trainer.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedTrainerId(trainer.id)}
                >
                  <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={trainer.avatar ?? undefined} alt={trainer.name} />
                        <AvatarFallback className="bg-(--mia-purple) text-white text-[11px] font-semibold">
                          {getInitials(trainer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{trainer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">{trainer.email}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {trainer.specializations.length === 0 ? (
                        <span className="italic text-muted-foreground/60 text-sm">—</span>
                      ) : (
                        <>
                          {trainer.specializations.slice(0, 2).map(s => (
                            <Badge key={s} variant="secondary" className="text-[11px]">{s}</Badge>
                          ))}
                          {trainer.specializations.length > 2 && (
                            <Badge variant="outline" className="text-[11px]">
                              +{trainer.specializations.length - 2}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right tabular-nums">{trainer.courseCount}</TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    {trainer.rating !== null ? (
                      <span className="inline-flex items-center justify-end gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {trainer.rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">{formatDate(trainer.createdAt)}</TableCell>
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
                        <DropdownMenuItem onClick={() => setSelectedTrainerId(trainer.id)}>
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget({ userId: trainer.userId, name: trainer.name })}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {total} formateur{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lignes par page</span>
              <span className="text-xs font-medium">{pageSize}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: '1' })}
                disabled={page === 1} aria-label="Première page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page === 1} aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page === totalPages} aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(totalPages) })}
                disabled={page === totalPages} aria-label="Dernière page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Trainer detail sheet */}
      <TrainerDetailSheet
        trainerId={selectedTrainerId}
        onClose={() => setSelectedTrainerId(null)}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Supprimer le formateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ? Son compte
              et toutes les données associées seront définitivement supprimés.
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
