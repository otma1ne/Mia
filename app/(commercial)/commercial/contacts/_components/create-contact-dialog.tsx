'use client'

import { useState, useTransition } from 'react'
import { createContact } from '@/app/actions/commercial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CreateContactDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Nouveau contact</DialogTitle>
          <DialogDescription>Ajoutez un nouveau prospect à votre liste.</DialogDescription>
        </DialogHeader>
        {open && <ContactForm key="create" onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function ContactForm({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [city,      setCity]      = useState('')
  const [need,      setNeed]      = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await createContact({ firstName, lastName, phone, email: email || undefined, city: city || undefined, need })
      if (result?.error) { setError(result.error); return }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cc-firstName">Prénom *</Label>
          <Input id="cc-firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cc-lastName">Nom *</Label>
          <Input id="cc-lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-phone">Téléphone *</Label>
        <Input id="cc-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-email">Email (optionnel)</Label>
        <Input id="cc-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-city">Ville (optionnel)</Label>
        <Input id="cc-city" value={city} onChange={e => setCity(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cc-need">Besoin du client *</Label>
        <textarea
          id="cc-need"
          value={need}
          onChange={e => setNeed(e.target.value)}
          rows={3}
          maxLength={500}
          required
          placeholder="Décrivez le besoin du prospect…"
          className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création…</> : 'Créer le contact'}
        </Button>
      </DialogFooter>
    </form>
  )
}
