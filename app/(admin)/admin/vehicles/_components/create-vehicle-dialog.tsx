'use client'

import { useActionState, useRef, useState } from 'react'
import { createVehicle } from '@/app/actions/vehicles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Car, Upload, X } from 'lucide-react'
import Image from 'next/image'

const CATEGORIES = [
  { value: 'Permis B',    label: 'Permis B' },
  { value: 'Permis A',    label: 'Permis A' },
  { value: 'Permis A1',   label: 'Permis A1' },
  { value: 'Permis A2',   label: 'Permis A2' },
  { value: 'Permis C',    label: 'Permis C' },
  { value: 'Permis BE',   label: 'Permis BE' },
]

const STATUS_OPTIONS = [
  { value: 'AVAILABLE',   label: 'Disponible' },
  { value: 'IN_USE',      label: 'En service' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
]

export default function CreateVehicleDialog() {
  const [open, setOpen]         = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState<string>('Permis B')
  const [status, setStatus]     = useState<string>('AVAILABLE')
  const fileRef = useRef<HTMLInputElement>(null)

  const [state, action, isPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      formData.set('photo', photoUrl)
      formData.set('category', category)
      formData.set('status', status)
      const result = await createVehicle(prev, formData)
      if (result?.success) {
        setOpen(false)
        setPhotoUrl('')
        setCategory('Permis B')
        setStatus('AVAILABLE')
      }
      return result
    },
    null
  )

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

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Ajouter un véhicule
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau véhicule</DialogTitle>
          </DialogHeader>

          <form action={action} className="space-y-4">
            {/* Photo */}
            <div className="space-y-1.5">
              <Label>Photo (optionnel)</Label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Aperçu" width={64} height={64} className="h-full w-full object-cover" />
                  ) : (
                    <Car className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {uploading ? 'Envoi…' : 'Choisir une image'}
                  </Button>
                  {photoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
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
              <Label htmlFor="cv-name">Nom / Modèle</Label>
              <Input id="cv-name" name="name" placeholder="Renault Clio" required />
            </div>

            {/* Plate */}
            <div className="space-y-1.5">
              <Label htmlFor="cv-plate">Immatriculation</Label>
              <Input id="cv-plate" name="plate" placeholder="AB-123-CD" required className="uppercase" />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select
                value={category}
                onValueChange={v => setCategory(String(v))}
                labelItems={Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-72">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} label={c.label}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={status}
                onValueChange={v => setStatus(String(v))}
                labelItems={{ AVAILABLE: 'Disponible', IN_USE: 'En service', MAINTENANCE: 'Maintenance' }}
                required
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
              <Label htmlFor="cv-mileage">Kilométrage</Label>
              <div className="relative">
                <Input
                  id="cv-mileage"
                  name="mileage"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="pr-10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">km</span>
              </div>
            </div>

            {/* Inspection date */}
            <div className="space-y-1.5">
              <Label htmlFor="cv-inspection">Prochaine visite technique (optionnel)</Label>
              <Input id="cv-inspection" name="inspectionDate" type="date" />
            </div>

            {/* Insurance expiry */}
            <div className="space-y-1.5">
              <Label htmlFor="cv-insurance">Expiration assurance (optionnel)</Label>
              <Input id="cv-insurance" name="insuranceExpiry" type="date" />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending || uploading}>
                {isPending ? 'Création…' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
