'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateContactStatus } from '@/app/actions/commercial'
import type { ContactStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import GagneFormationDialog from './gagne-formation-dialog'

interface FormationOption {
  id: string
  title: string
  sessions: { id: string; title: string; formationId: string }[]
}

const STATUSES: {
  value: ContactStatus
  label: string
  className: string
  activeClass: string
}[] = [
  {
    value:       'PROSPECT',
    label:       'Prospect',
    className:   'border-blue-300 text-blue-700 hover:bg-blue-50',
    activeClass: 'bg-blue-100 border-blue-400 text-blue-800 font-semibold',
  },
  {
    value:       'INDECIS',
    label:       'Indécis',
    className:   'border-amber-300 text-amber-700 hover:bg-amber-50',
    activeClass: 'bg-amber-100 border-amber-400 text-amber-800 font-semibold',
  },
  {
    value:       'GAGNE',
    label:       'Gagné',
    className:   'border-green-300 text-green-700 hover:bg-green-50',
    activeClass: 'bg-green-100 border-green-400 text-green-800 font-semibold',
  },
  {
    value:       'PERDU',
    label:       'Perdu',
    className:   'border-red-300 text-red-700 hover:bg-red-50',
    activeClass: 'bg-red-100 border-red-400 text-red-800 font-semibold',
  },
]

interface Props {
  contactId: string
  currentStatus: ContactStatus
  formations: FormationOption[]
}

export default function ContactStatusSelector({ contactId, currentStatus, formations }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [note, setNote]             = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [selected, setSelected]     = useState<ContactStatus | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [gagneOpen, setGagneOpen]   = useState(false)

  function handleSelect(status: ContactStatus) {
    if (status === currentStatus) return
    if (status === 'GAGNE') {
      setSelected(null)
      setNote('')
      setReminderDate('')
      setGagneOpen(true)
      return
    }
    setSelected(status)
    setNote('')
    setReminderDate('')
    setError(null)
  }

  function handleConfirm() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      const rd = selected === 'INDECIS' && reminderDate
        ? new Date(reminderDate)
        : null
      const result = await updateContactStatus(contactId, selected, note || undefined, rd)
      if (result?.error) { setError(result.error); return }
      setSelected(null)
      setNote('')
      setReminderDate('')
      router.refresh()
    })
  }

  // Today's date in YYYY-MM-DD for min attribute
  const todayStr = new Date().toISOString().split('T')[0]

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
            Changer vers <strong>{STATUSES.find(s => s.value === selected)?.label}</strong>
          </p>

          {selected === 'INDECIS' && (
            <div className="space-y-1">
              <label htmlFor="reminder-date" className="text-xs text-muted-foreground">
                Date de rappel (optionnel)
              </label>
              <input
                id="reminder-date"
                type="date"
                min={todayStr}
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                title="Date de rappel"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          <Input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note optionnelle sur ce changement…"
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

      <GagneFormationDialog
        open={gagneOpen}
        onClose={() => setGagneOpen(false)}
        onSuccess={() => router.refresh()}
        contactId={contactId}
        formations={formations}
      />
    </div>
  )
}
