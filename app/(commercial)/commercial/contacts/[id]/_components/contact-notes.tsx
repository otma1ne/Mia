'use client'

import { useState, useTransition } from 'react'
import { updateContactNotes } from '@/app/actions/commercial'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface Props {
  contactId: string
  initialNotes: string
}

export default function ContactNotes({ contactId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    startTransition(async () => {
      const result = await updateContactNotes(contactId, notes)
      if (!result?.error) setSaved(true)
    })
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Notes</h2>
      <textarea
        value={notes}
        onChange={e => { setNotes(e.target.value); setSaved(false) }}
        rows={4}
        maxLength={2000}
        placeholder="Vos notes sur ce contact…"
        className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Enregistrement…</> : 'Enregistrer'}
        </Button>
        {saved && <span className="text-xs text-green-600">Notes enregistrées</span>}
      </div>
    </div>
  )
}
