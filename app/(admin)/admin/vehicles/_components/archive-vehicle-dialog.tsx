'use client'

import { useState, useTransition } from 'react'
import { archiveVehicle } from '@/app/actions/vehicles'
import type { VehicleRow } from '@/app/actions/vehicles'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Archive, Loader2 } from 'lucide-react'

interface Props {
  vehicle: VehicleRow | null
  onClose: () => void
}

export default function ArchiveVehicleDialog({ vehicle, onClose }: Props) {
  return (
    <Dialog open={!!vehicle} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archiver le véhicule
          </DialogTitle>
          <DialogDescription>
            {vehicle && (
              <>
                <strong>{vehicle.name}</strong> ({vehicle.plate}) sera retiré de la liste principale.
                Vous pourrez le consulter dans les Archives et le réactiver plus tard.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {vehicle && <ArchiveForm key={vehicle.id} vehicle={vehicle} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function ArchiveForm({ vehicle, onClose }: { vehicle: VehicleRow; onClose: () => void }) {
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await archiveVehicle(vehicle.id, note || undefined)
      if (result?.error) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="av-note">Note (optionnel)</Label>
        <textarea
          id="av-note"
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Raison de l'archivage…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
          {isPending ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Archivage…</>) : 'Archiver'}
        </Button>
      </DialogFooter>
    </>
  )
}
