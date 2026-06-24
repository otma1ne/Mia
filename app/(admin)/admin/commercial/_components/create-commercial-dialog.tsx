'use client'

import { useState, useTransition } from 'react'
import { createCommercialAccount } from '@/app/actions/commercial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, Briefcase } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateCommercialDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Nouveau commercial
          </DialogTitle>
          <DialogDescription>
            Un email avec les identifiants de connexion sera envoyé automatiquement.
          </DialogDescription>
        </DialogHeader>
        {open && <CreateForm key="new" onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createCommercialAccount({ name, email, phone: phone || undefined })
      if (result?.error) { setError(result.error); return }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="nc-name">Nom complet *</Label>
        <Input id="nc-name" value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nc-email">Email *</Label>
        <Input id="nc-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nc-phone">Téléphone (optionnel)</Label>
        <Input id="nc-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création…</> : 'Créer le compte'}
        </Button>
      </DialogFooter>
    </form>
  )
}
