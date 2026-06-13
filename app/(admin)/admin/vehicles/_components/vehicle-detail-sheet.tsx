'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { getVehicle, updateVehicle } from '@/app/actions/vehicles'
import type { VehicleRow } from '@/app/actions/vehicles'
import type { VehicleStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Car, Upload, X, Pencil, Tag } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import SaleInfoEditForm from './sale-info-edit-form'
import VehicleHistoryTimeline from './vehicle-history-timeline'
import MarkSoldDialog from './mark-sold-dialog'
import ArchiveVehicleDialog from './archive-vehicle-dialog'

// ─────────────────────────────────────────
// Config
// ─────────────────────────────────────────

const CATEGORIES = ['Permis B', 'Permis A', 'Permis A1', 'Permis A2', 'Permis C', 'Permis BE']

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'AVAILABLE',   label: 'Disponible' },
  { value: 'IN_USE',      label: 'En service' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

const statusConfig: Record<VehicleStatus, { dot: string; label: string }> = {
  AVAILABLE:   { dot: 'bg-emerald-500', label: 'Disponible' },
  IN_USE:      { dot: 'bg-blue-500',    label: 'En service' },
  MAINTENANCE: { dot: 'bg-amber-400',   label: 'Maintenance' },
  SOLD:        { dot: 'bg-zinc-500',    label: 'Vendu' },
}

function toInputDate(d: Date | null): string {
  if (!d) return ''
  return format(new Date(d), 'yyyy-MM-dd')
}

function DateBadge({ date, isAlert, isExpired }: {
  date: Date | null
  isAlert: boolean
  isExpired: boolean
}) {
  if (!date) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-sm',
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

interface VehicleDetailSheetProps {
  vehicleId: string | null
  onClose: () => void
}

export default function VehicleDetailSheet({ vehicleId, onClose }: VehicleDetailSheetProps) {
  const [vehicle, setVehicle]   = useState<VehicleRow | null>(null)
  const [editing, setEditing]   = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [category, setCategory] = useState<string>('')
  const [status, setStatus]     = useState<VehicleStatus>('AVAILABLE')
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [sellOpen, setSellOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  useEffect(() => {
    if (!vehicleId) { setVehicle(null); setEditing(false); return }
    getVehicle(vehicleId).then(v => {
      setVehicle(v)
      if (v) {
        setPhotoUrl(v.photo ?? '')
        setCategory(v.category)
        setStatus(v.status)
      }
    })
  }, [vehicleId])

  function startEditing() {
    if (!vehicle) return
    setPhotoUrl(vehicle.photo ?? '')
    setCategory(vehicle.category)
    setStatus(vehicle.status)
    setError(null)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError(null)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.url) setPhotoUrl(json.url)
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!vehicle) return
    setError(null)

    const fd = new FormData(e.currentTarget)
    const name     = (fd.get('name')     as string)?.trim()
    const plate    = (fd.get('plate')    as string)?.trim().toUpperCase()
    const mileage  = parseInt(fd.get('mileage') as string) || 0
    const inspRaw  = fd.get('inspectionDate') as string
    const insRaw   = fd.get('insuranceExpiry') as string

    const data = {
      name,
      plate,
      category,
      status,
      photo:          photoUrl || null,
      mileage,
      inspectionDate: inspRaw  ? new Date(inspRaw)  : null,
      insuranceExpiry: insRaw  ? new Date(insRaw)   : null,
    }

    startTransition(async () => {
      const result = await updateVehicle(vehicle.id, data)
      if (result?.error) {
        setError(result.error)
      } else {
        // Update local state
        setVehicle(v => v ? { ...v, ...data } : v)
        setEditing(false)
      }
    })
  }

  const { dot, label } = vehicle ? statusConfig[vehicle.status] : { dot: '', label: '' }

  return (
    <>
    <Sheet open={!!vehicleId} onOpenChange={open => { if (!open) { onClose(); setEditing(false) } }}>
      <SheetContent className="sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Détails du véhicule</SheetTitle>
            {vehicle && !editing && (
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Modifier
              </Button>
            )}
          </div>
        </SheetHeader>

        {vehicle && !editing && (
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Photo */}
            <div className="flex justify-center">
              {vehicle.photo ? (
                <div className="h-32 w-full max-w-xs rounded-xl overflow-hidden bg-muted">
                  <Image src={vehicle.photo} alt={vehicle.name} width={320} height={128} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-32 w-full max-w-xs rounded-xl bg-muted flex items-center justify-center">
                  <Car className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Name + plate */}
            <div className="space-y-0.5">
              <p className="text-xl font-semibold">{vehicle.name}</p>
              <Badge variant="secondary" className="font-mono text-xs">{vehicle.plate}</Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Catégorie</p>
                <p className="font-medium">{vehicle.category}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Statut</p>
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                  <span className="font-medium">{label}</span>
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Kilométrage</p>
                <p className="font-medium tabular-nums">{vehicle.mileage.toLocaleString('fr-FR')} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Ajouté le</p>
                <p className="font-medium">{format(new Date(vehicle.createdAt), 'd MMM yyyy', { locale: fr })}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Visite technique</p>
                <DateBadge
                  date={vehicle.inspectionDate}
                  isAlert={vehicle.isAlertInspection}
                  isExpired={vehicle.isExpiredInspection}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Expiration assurance</p>
                <DateBadge
                  date={vehicle.insuranceExpiry}
                  isAlert={vehicle.isAlertInsurance}
                  isExpired={vehicle.isExpiredInsurance}
                />
              </div>
            </div>

            {/* Vente (only when SOLD) */}
            {vehicle.status === 'SOLD' && vehicle.sale && (
              <SaleSection
                vehicleId={vehicle.id}
                sale={vehicle.sale}
                onSaleUpdated={next => setVehicle(v => v ? { ...v, sale: next } : v)}
              />
            )}

            {/* Historique */}
            <VehicleHistoryTimeline vehicleId={vehicle.id} />
          </div>
        )}

        {vehicle && !editing && !vehicle.archived && (
          <SheetFooter className="px-6 py-4 border-t">
            {vehicle.status !== 'SOLD' && (
              <Button variant="outline" onClick={() => setSellOpen(true)}>
                <Tag className="h-3.5 w-3.5 mr-1.5" /> Vendre
              </Button>
            )}
            <Button variant="destructive" onClick={() => setArchiveOpen(true)}>
              Archiver
            </Button>
          </SheetFooter>
        )}

        {vehicle && editing && (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Photo */}
              <div className="space-y-1.5">
                <Label>Photo</Label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {photoUrl ? (
                      <Image src={photoUrl} alt="Aperçu" width={64} height={64} className="h-full w-full object-cover" />
                    ) : (
                      <Car className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {uploading ? 'Envoi…' : 'Changer'}
                    </Button>
                    {photoUrl && (
                      <Button
                        type="button" variant="ghost" size="sm"
                        className="text-destructive hover:text-destructive h-7 px-2"
                        onClick={() => { setPhotoUrl(''); if (fileRef.current) fileRef.current.value = '' }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-name">Nom / Modèle</Label>
                <Input id="ev-name" name="name" defaultValue={vehicle.name} required />
              </div>

              {/* Plate */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-plate">Immatriculation</Label>
                <Input id="ev-plate" name="plate" defaultValue={vehicle.plate} required className="uppercase" />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select
                  value={category}
                  onValueChange={v => setCategory(String(v))}
                  labelItems={Object.fromEntries(CATEGORIES.map(c => [c, c]))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-72">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} label={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select
                  value={status}
                  onValueChange={v => setStatus(v as VehicleStatus)}
                  labelItems={{ AVAILABLE: 'Disponible', IN_USE: 'En service', MAINTENANCE: 'Maintenance' }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-72">
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value} label={s.label}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mileage */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-mileage">Kilométrage</Label>
                <div className="relative">
                  <Input id="ev-mileage" name="mileage" type="number" min={0} defaultValue={vehicle.mileage} className="pr-10" />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">km</span>
                </div>
              </div>

              {/* Inspection */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-inspection">Prochaine visite technique</Label>
                <Input id="ev-inspection" name="inspectionDate" type="date" defaultValue={toInputDate(vehicle.inspectionDate)} />
              </div>

              {/* Insurance */}
              <div className="space-y-1.5">
                <Label htmlFor="ev-insurance">Expiration assurance</Label>
                <Input id="ev-insurance" name="insuranceExpiry" type="date" defaultValue={toInputDate(vehicle.insuranceExpiry)} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <SheetFooter className="px-6 py-4 border-t">
              <Button type="button" variant="outline" onClick={cancelEditing}>Annuler</Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
    <MarkSoldDialog
      vehicle={sellOpen ? vehicle : null}
      onClose={() => {
        setSellOpen(false)
        if (vehicle) getVehicle(vehicle.id).then(setVehicle)
      }}
    />
    <ArchiveVehicleDialog
      vehicle={archiveOpen ? vehicle : null}
      onClose={() => {
        setArchiveOpen(false)
        if (vehicle) getVehicle(vehicle.id).then(setVehicle)
      }}
    />
    </>
  )
}

function SaleSection({
  vehicleId, sale, onSaleUpdated,
}: {
  vehicleId: string
  sale: NonNullable<VehicleRow['sale']>
  onSaleUpdated: (next: NonNullable<VehicleRow['sale']>) => void
}) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="border-t pt-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vente</p>
        <SaleInfoEditForm
          vehicleId={vehicleId}
          initial={sale}
          onSaved={(next) => { onSaleUpdated(next); setEditing(false) }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Tag className="h-3 w-3" /> Vente
        </p>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setEditing(true)}>
          Modifier
        </Button>
      </div>
      <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
        <p><span className="text-muted-foreground">Acheteur :</span> {sale.buyerLastName} {sale.buyerFirstName}</p>
        <p><span className="text-muted-foreground">Téléphone :</span> {sale.buyerPhone}</p>
        {sale.buyerEmail && <p><span className="text-muted-foreground">Email :</span> {sale.buyerEmail}</p>}
        <p><span className="text-muted-foreground">Date :</span> {format(new Date(sale.saleDate), 'd MMM yyyy', { locale: fr })}</p>
        <p><span className="text-muted-foreground">Prix :</span> <span className="tabular-nums font-medium">{sale.salePrice.toLocaleString('fr-FR')}</span></p>
      </div>
    </div>
  )
}
