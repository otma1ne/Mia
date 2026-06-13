'use client'

import { useState, useTransition } from 'react'
import { updateVehicleSale } from '@/app/actions/vehicles'
import type { SaleInfoData } from '@/app/actions/vehicles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  vehicleId: string
  initial: SaleInfoData
  onSaved: (next: SaleInfoData) => void
  onCancel: () => void
}

export default function SaleInfoEditForm({ vehicleId, initial, onSaved, onCancel }: Props) {
  const [firstName, setFirstName] = useState(initial.buyerFirstName)
  const [lastName,  setLastName]  = useState(initial.buyerLastName)
  const [phone,     setPhone]     = useState(initial.buyerPhone)
  const [email,     setEmail]     = useState(initial.buyerEmail ?? '')
  const [saleDate,  setSaleDate]  = useState(format(new Date(initial.saleDate), 'yyyy-MM-dd'))
  const [price,     setPrice]     = useState(String(initial.salePrice))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateVehicleSale(vehicleId, {
        buyerFirstName: firstName,
        buyerLastName:  lastName,
        buyerPhone:     phone,
        buyerEmail:     email || undefined,
        saleDate:       new Date(saleDate),
        salePrice:      Number(price),
      })
      if (result?.error) { setError(result.error); return }
      onSaved({
        buyerFirstName: firstName,
        buyerLastName:  lastName,
        buyerPhone:     phone,
        buyerEmail:     email || null,
        saleDate:       new Date(saleDate),
        salePrice:      Number(price),
      })
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border bg-muted/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="se-firstName" className="text-xs">Prénom</Label>
          <Input id="se-firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="se-lastName" className="text-xs">Nom</Label>
          <Input id="se-lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="se-phone" className="text-xs">Téléphone</Label>
        <Input id="se-phone" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="se-email" className="text-xs">Email</Label>
        <Input id="se-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="se-date" className="text-xs">Date</Label>
          <Input id="se-date" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="se-price" className="text-xs">Prix</Label>
          <Input id="se-price" type="number" min={0} step={0.01} value={price} onChange={e => setPrice(e.target.value)} required />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Enregistrement…</> : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
