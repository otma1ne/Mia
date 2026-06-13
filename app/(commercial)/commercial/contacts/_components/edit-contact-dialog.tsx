'use client'

import { useState, useTransition } from 'react'
import { updateContact } from '@/app/actions/commercial'
import type { ContactRow } from '@/app/actions/commercial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface Props {
  contact: ContactRow | null
  onClose: () => void
}

export default function EditContactDialog({ contact, onClose }: Props) {
  return (
    <Dialog open={!!contact} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Modifier le contact</DialogTitle>
        </DialogHeader>
        {contact && <EditForm key={contact.id} contact={contact} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function EditForm({ contact, onClose }: { contact: ContactRow; onClose: () => void }) {
  const [firstName, setFirstName] = useState(contact.firstName)
  const [lastName,  setLastName]  = useState(contact.lastName)
  const [phone,     setPhone]     = useState(contact.phone)
  const [email,     setEmail]     = useState(contact.email ?? '')
  const [city,      setCity]      = useState(contact.city ?? '')
  const [need,      setNeed]      = useState(contact.need)
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await updateContact(contact.id, {
        firstName, lastName, phone,
        email: email || undefined,
        city: city || undefined,
        need,
      })
      if (result?.error) { setError(result.error); return }
      onClose()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="ec-firstName">Prénom *</Label>
          <Input id="ec-firstName" value={firstName} onChange={e => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ec-lastName">Nom *</Label>
          <Input id="ec-lastName" value={lastName} onChange={e => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-phone">Téléphone *</Label>
        <Input id="ec-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-email">Email (optionnel)</Label>
        <Input id="ec-email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-city">Ville (optionnel)</Label>
        <Input id="ec-city" value={city} onChange={e => setCity(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ec-need">Besoin du client *</Label>
        <textarea
          id="ec-need"
          value={need}
          onChange={e => setNeed(e.target.value)}
          rows={3}
          maxLength={500}
          required
          className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</> : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </form>
  )
}
