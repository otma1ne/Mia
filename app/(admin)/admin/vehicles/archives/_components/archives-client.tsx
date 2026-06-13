'use client'

import { useCallback, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { reactivateVehicle } from '@/app/actions/vehicles'
import type { VehiclesResult, VehicleRow } from '@/app/actions/vehicles'
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, Search, Car, RotateCcw, Loader2, Tag,
} from 'lucide-react'
import Image from 'next/image'
import VehicleDetailSheet from '../../_components/vehicle-detail-sheet'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  data: VehiclesResult
  search: string
}

export default function ArchivesClient({ data, search: initialSearch }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reactTarget, setReactTarget] = useState<VehicleRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
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

  function handleReactivate() {
    if (!reactTarget) return
    setError(null)
    startTransition(async () => {
      const result = await reactivateVehicle(reactTarget.id)
      if (result?.error) { setError(result.error); return }
      setReactTarget(null)
      router.refresh()
    })
  }

  const { vehicles, total, page, pageSize, totalPages } = data

  return (
    <>
      <div className="flex items-center justify-end gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher dans les archives…"
            className="pl-8 w-64"
          />
        </div>
      </div>

      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Véhicule</TableHead>
              <TableHead className="px-5 text-xs">Immatriculation</TableHead>
              <TableHead className="px-5 text-xs">Catégorie</TableHead>
              <TableHead className="px-5 text-xs">Vendu</TableHead>
              <TableHead className="px-5 text-xs">Archivé le</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch
                    ? `Aucun véhicule archivé ne correspond à "${initialSearch}".`
                    : 'Aucun véhicule archivé.'}
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle, i) => (
                <TableRow
                  key={vehicle.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedId(vehicle.id)}
                >
                  <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {vehicle.photo ? (
                        <div className="h-9 w-9 shrink-0 rounded-md overflow-hidden bg-muted">
                          <Image src={vehicle.photo} alt={vehicle.name} width={36} height={36} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center">
                          <Car className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{vehicle.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge variant="secondary" className="font-mono text-[11px]">{vehicle.plate}</Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">{vehicle.category}</TableCell>
                  <TableCell className="px-5 py-4">
                    {vehicle.status === 'SOLD' ? (
                      <Badge variant="secondary" className="inline-flex items-center gap-1">
                        <Tag className="h-3 w-3" /> Vendu
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">
                    {vehicle.archivedAt
                      ? format(new Date(vehicle.archivedAt), 'd MMM yyyy', { locale: fr })
                      : '—'}
                  </TableCell>
                  <TableCell className="px-5 py-4" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            aria-label="Actions"
                            className="cursor-pointer rounded p-1 text-muted-foreground outline-none hover:text-foreground"
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedId(vehicle.id)}>
                          Voir les détails
                        </DropdownMenuItem>
                        {vehicle.status !== 'SOLD' && (
                          <DropdownMenuItem onClick={() => setReactTarget(vehicle)}>
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Réactiver
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {total} véhicule{total !== 1 ? 's' : ''}
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

      <VehicleDetailSheet vehicleId={selectedId} onClose={() => setSelectedId(null)} />

      <Dialog open={!!reactTarget} onOpenChange={open => { if (!open) setReactTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Réactiver le véhicule</DialogTitle>
            <DialogDescription>
              <strong>{reactTarget?.name}</strong> sera retiré des archives et marqué comme <em>Disponible</em>.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactTarget(null)} disabled={isPending}>Annuler</Button>
            <Button onClick={handleReactivate} disabled={isPending}>
              {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Réactivation…</> : 'Réactiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
