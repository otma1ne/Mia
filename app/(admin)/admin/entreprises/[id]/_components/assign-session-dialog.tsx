'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { createCompanyInscription } from '@/app/actions/companies'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type SessionOption = {
  id:        string
  title:     string
  startDate: Date
  endDate:   Date
  formation: { title: string }
}

export default function AssignSessionDialog({
  companyId,
  sessions,
}: {
  companyId: string
  sessions:  SessionOption[]
}) {
  const [open, setOpen]         = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) { setFeedback(null); setSessionId('') }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionId) return
    setFeedback(null)

    startTransition(async () => {
      const result = await createCompanyInscription(companyId, sessionId)
      if (result.success) {
        setFeedback({ type: 'success', message: 'Session assignée à l\'entreprise.' })
        setSessionId('')
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Erreur.' })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <CalendarPlus className="h-4 w-4" />
        Assigner une session
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner une session de formation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {feedback && (
            <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {feedback.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              {feedback.message}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-medium">Session de formation</p>
            <Select
              value={sessionId}
              onValueChange={v => setSessionId(v as string)}
              labelItems={Object.fromEntries(sessions.map(s => [s.id, `${s.formation.title} — ${s.title}`]))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner une session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id} label={`${s.formation.title} — ${s.title}`}>
                    <div className="flex flex-col">
                      <span className="font-medium">{s.formation.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.title} · {format(new Date(s.startDate), 'dd MMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !sessionId}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assignation…</> : 'Assigner'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
