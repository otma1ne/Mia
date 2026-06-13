'use client'

import { useState, useTransition } from 'react'
import { markVehicleAsSold } from '@/app/actions/vehicles'
import type { VehicleRow } from '@/app/actions/vehicles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Tag } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  vehicle: VehicleRow | null
  onClose: () => void
}

export default function MarkSoldDialog({ vehicle, onClose }: Props) {
  return (
    <Dialog open={!!vehicle} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-zinc-500" />
            Marquer comme vendu
          </DialogTitle>
          <DialogDescription>
            {vehicle && <>Vente définitive du véhicule <strong>{vehicle.name}</strong> ({vehicle.plate}). Cette action ne peut pas être annulée.</>}
          </DialogDescription>
        </DialogHeader>

        {vehicle && <MarkSoldForm key={vehicle.id} vehicle={vehicle} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function MarkSoldForm({ vehicle, onClose }: { vehicle: VehicleRow; onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [phone, setPhone]         = useState('')
  const [email, setEmail]         = useState('')
  const [saleDate, setSaleDate]   = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [price, setPrice]         = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await markVehicleAsSold(vehicle.id, {
        buyerFirstName: firstName,
        buyerLastName:  lastName,
        buyerPhone:     phone,
        buyerEmail:     email || undefined,
        saleDate:       new Date(saleDate),
        salePrice:      Number(price),
      })
      if (result?.error) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ms-firstName">Prénom *</Label>
          <Input id="ms-firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ms-lastName">Nom *</Label>
          <Input id="ms-lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ms-phone">Téléphone *</Label>
        <Input id="ms-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ms-email">Email (optionnel)</Label>
        <Input id="ms-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ms-saleDate">Date de vente *</Label>
          <Input
            id="ms-saleDate"
            type="date"
            value={saleDate}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={e => setSaleDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ms-price">Prix *</Label>
          <Input
            id="ms-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter className="pt-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</>) : 'Confirmer la vente'}
        </Button>
      </DialogFooter>
    </form>
  )
}
