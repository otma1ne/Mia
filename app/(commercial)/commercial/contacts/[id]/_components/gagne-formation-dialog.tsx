'use client'

import { useState, useTransition } from 'react'
import { convertContactToGagne } from '@/app/actions/commercial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface FormationOption {
  id: string
  title: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  contactId: string
  formations: FormationOption[]
}

export default function GagneFormationDialog({
  open, onClose, onSuccess, contactId, formations,
}: Props) {
  const [formationId, setFormationId] = useState('')
  const [note, setNote]               = useState('')
  const [error, setError]             = useState<string | null>(null)
  const [pending, startTransition]    = useTransition()

  function handleClose() {
    setFormationId('')
    setNote('')
    setError(null)
    onClose()
  }

  function handleConfirm() {
    if (!formationId) { setError('Choisissez une formation.'); return }
    setError(null)
    startTransition(async () => {
      const result = await convertContactToGagne(contactId, formationId, note || undefined)
      if (result?.error) { setError(result.error); return }
      handleClose()
      onSuccess()
    })
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marquer comme Gagné</DialogTitle>
          <DialogDescription>
            Choisissez la formation à laquelle ce prospect sera inscrit. Une demande d&apos;inscription sera créée automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Formation *</label>
            <Select value={formationId} onValueChange={v => setFormationId(v as string)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une formation…" />
              </SelectTrigger>
              <SelectContent>
                {formations.map(f => (
                  <SelectItem key={f.id} value={f.id} label={f.title}>
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Note (optionnelle)</label>
            <Input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Contexte ou remarque…"
              maxLength={500}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={pending}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={pending || !formationId}>
            {pending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Création…</> : 'Confirmer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
