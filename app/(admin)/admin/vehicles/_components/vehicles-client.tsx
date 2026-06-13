'use client'

import { useCallback, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { VehiclesResult, VehicleRow } from '@/app/actions/vehicles'
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
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreVertical, Search, AlertTriangle, Car, Archive, Tag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import CreateVehicleDialog from './create-vehicle-dialog'
import VehicleDetailSheet from './vehicle-detail-sheet'
import MarkSoldDialog from './mark-sold-dialog'
import ArchiveVehicleDialog from './archive-vehicle-dialog'
import type { VehicleStatus } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const STATUS_TABS = [
  { key: 'all',         label: 'Tous' },
  { key: 'AVAILABLE',   label: 'Disponibles' },
  { key: 'IN_USE',      label: 'En service' },
  { key: 'MAINTENANCE', label: 'Maintenance' },
  { key: 'SOLD',        label: 'Vendus' },
] as const

type TabKey = typeof STATUS_TABS[number]['key']

const statusConfig: Record<VehicleStatus, { dot: string; label: string }> = {
  AVAILABLE:   { dot: 'bg-emerald-500', label: 'Disponible' },
  IN_USE:      { dot: 'bg-blue-500',    label: 'En service' },
  MAINTENANCE: { dot: 'bg-amber-400',   label: 'Maintenance' },
  SOLD:        { dot: 'bg-zinc-500',    label: 'Vendu' },
}

function DateCell({ date, isAlert, isExpired }: {
  date: Date | null
  isAlert: boolean
  isExpired: boolean
}) {
  if (!date) return <span className="text-muted-foreground">—</span>

  return (
    <span className={cn(
      'inline-flex items-center gap-1',
      isExpired ? 'text-destructive' : isAlert ? 'text-amber-600 dark:text-amber-400' : ''
    )}>
      {isAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
      {format(new Date(date), 'd MMM yyyy', { locale: fr })}
    </span>
  )
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

interface VehiclesClientProps {
  data: VehiclesResult
  search: string
  activeStatus: TabKey
  archivedCount: number
}

export default function VehiclesClient({
  data, search: initialSearch, activeStatus, archivedCount,
}: VehiclesClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [sellTarget, setSellTarget]   = useState<VehicleRow | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<VehicleRow | null>(null)
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

  const { vehicles, total, page, pageSize, totalPages } = data

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Status tabs */}
        <div className="flex gap-0.5 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleTabChange(key)}
              className={cn(
                'relative flex cursor-pointer select-none items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                activeStatus === key
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + create */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              defaultValue={initialSearch}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher un véhicule…"
              className="pl-8 w-52"
            />
          </div>
          <Link
            href="/admin/vehicles/archives"
            className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Archive className="h-3.5 w-3.5" />
            Archives
            {archivedCount > 0 && (
              <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-[11px] tabular-nums">
                {archivedCount}
              </Badge>
            )}
          </Link>
          <CreateVehicleDialog />
        </div>
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Véhicule</TableHead>
              <TableHead className="px-5 text-xs">Immatriculation</TableHead>
              <TableHead className="px-5 text-xs">Catégorie</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
              <TableHead className="px-5 text-right text-xs">Kilométrage</TableHead>
              <TableHead className="px-5 text-xs">Visite technique</TableHead>
              <TableHead className="px-5 text-xs">Assurance</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch
                    ? `Aucun véhicule ne correspond à "${initialSearch}".`
                    : 'Aucun véhicule pour l\'instant.'}
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle, i) => {
                const { dot, label } = statusConfig[vehicle.status]
                return (
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
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium truncate">{vehicle.name}</span>
                          {vehicle.sale && (
                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5">
                              <Tag className="h-3 w-3 shrink-0" />
                              Vendu le {format(new Date(vehicle.sale.saleDate), 'd MMM yyyy', { locale: fr })}
                              {' à '}
                              {vehicle.sale.buyerLastName} {vehicle.sale.buyerFirstName}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge variant="secondary" className="font-mono text-[11px]">{vehicle.plate}</Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-muted-foreground">{vehicle.category}</TableCell>
                    <TableCell className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                        <span>{label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                      {vehicle.mileage.toLocaleString('fr-FR')} km
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <DateCell
                        date={vehicle.inspectionDate}
                        isAlert={vehicle.isAlertInspection}
                        isExpired={vehicle.isExpiredInspection}
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <DateCell
                        date={vehicle.insuranceExpiry}
                        isAlert={vehicle.isAlertInsurance}
                        isExpired={vehicle.isExpiredInsurance}
                      />
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
                            <DropdownMenuItem onClick={() => setSellTarget(vehicle)}>
                              Marquer comme vendu
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setArchiveTarget(vehicle)}
                          >
                            Archiver
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
            {total} véhicule{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lignes par page</span>
              <span className="text-xs font-medium">{pageSize}</span>
            </div>
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

      {/* Detail sheet */}
      <VehicleDetailSheet vehicleId={selectedId} onClose={() => setSelectedId(null)} />

      <MarkSoldDialog
        vehicle={sellTarget}
        onClose={() => setSellTarget(null)}
      />

      <ArchiveVehicleDialog
        vehicle={archiveTarget}
        onClose={() => setArchiveTarget(null)}
      />
    </>
  )
}
