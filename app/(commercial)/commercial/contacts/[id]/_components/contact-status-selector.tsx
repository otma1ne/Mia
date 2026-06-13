'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateContactStatus } from '@/app/actions/commercial'
import type { ContactStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

const STATUSES: { value: ContactStatus; label: string; className: string; activeClass: string }[] = [
  { value: 'NOUVEAU',  label: 'Nouveau',  className: 'border-blue-300 text-blue-700 hover:bg-blue-50',   activeClass: 'bg-blue-100 border-blue-400 text-blue-800 font-semibold' },
  { value: 'CONTACTE', label: 'Contacté', className: 'border-amber-300 text-amber-700 hover:bg-amber-50', activeClass: 'bg-amber-100 border-amber-400 text-amber-800 font-semibold' },
  { value: 'RELANCE',  label: 'Relancé',  className: 'border-orange-300 text-orange-700 hover:bg-orange-50', activeClass: 'bg-orange-100 border-orange-400 text-orange-800 font-semibold' },
  { value: 'CONVERTI', label: 'Converti', className: 'border-green-300 text-green-700 hover:bg-green-50',  activeClass: 'bg-green-100 border-green-400 text-green-800 font-semibold' },
]

interface Props {
  contactId: string
  currentStatus: ContactStatus
}

export default function ContactStatusSelector({ contactId, currentStatus }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const [selected, setSelected] = useState<ContactStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleSelect(status: ContactStatus) {
    if (status === currentStatus) return
    setSelected(status)
    setNote('')
    setError(null)
  }

  function handleConfirm() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const result = await updateContactStatus(contactId, selected, note || undefined)
      if (result?.error) { setError(result.error); return }
      setSelected(null)
      setNote('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium">Statut</h2>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <button
            key={s.value}
            type="button"
            disabled={pending}
            onClick={() => handleSelect(s.value)}
            className={`px-4 py-1.5 rounded-full border text-sm transition-colors ${
              currentStatus === s.value ? s.activeClass : s.className
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {selected && selected !== currentStatus && (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-sm">
            Changer vers <strong>{STATUSES.find(s => s.value === selected)?.label}</strong> — note optionnelle :
          </p>
          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note sur ce changement…"
            maxLength={500}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleConfirm} disabled={pending}>
              {pending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Mise à jour…</> : 'Confirmer'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelected(null)} disabled={pending}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
