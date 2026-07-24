'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { updateTrainingSession, type TrainingSessionListRow } from '@/app/actions/training-sessions'
import type { TrainingNiveau } from '@prisma/client'

interface Props {
  session: TrainingSessionListRow
  trainers: { id: string; name: string }[]
  open: boolean
  onClose: () => void
  onUpdated: (updated: Partial<TrainingSessionListRow>) => void
}

export default function EditTrainingSessionDialog({ session, trainers, open, onClose, onUpdated }: Props) {
  const [title, setTitle]         = useState(session.title)
  const [niveau, setNiveau]       = useState<TrainingNiveau | ''>(session.niveau ?? '')
  const [startDate, setStartDate] = useState(toDateInput(session.startDate))
  const [endDate, setEndDate]     = useState(toDateInput(session.endDate))
  const [maxStudents, setMax]     = useState(String(session.maxStudents))
  const [price, setPrice]         = useState(session.price != null ? String(session.price) : '')
  const [trainerId, setTrainerId] = useState(session.trainerId ?? '')
  const [location, setLocation]   = useState(session.location ?? '')
  const [onlineUrl, setOnlineUrl] = useState(session.onlineUrl ?? '')
  const [notes, setNotes]         = useState(session.notes ?? '')
  const [error, setError]         = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError('')
    if (!title.trim() || !startDate || !endDate) {
      setError('Titre, date de début et date de fin sont obligatoires.')
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('La date de fin doit être après la date de début.')
      return
    }
    startTransition(async () => {
      const result = await updateTrainingSession(session.id, {
        title:       title.trim(),
        niveau:      niveau || null,
        startDate,
        endDate,
        maxStudents: parseInt(maxStudents) || session.maxStudents,
        price:       price ? parseFloat(price) : null,
        trainerId:   trainerId || null,
        location:    location || null,
        onlineUrl:   onlineUrl || null,
        notes:       notes || null,
      })
      if (result.error) { setError(result.error); return }
      const trainer = trainers.find(t => t.id === trainerId)
      onUpdated({
        title:       title.trim(),
        niveau:      niveau || null,
        startDate:   new Date(startDate),
        endDate:     new Date(endDate),
        maxStudents: parseInt(maxStudents) || session.maxStudents,
        price:       price ? parseFloat(price) : null,
        trainerId:   trainerId || null,
        trainerName: trainer?.name ?? null,
        location:    location || null,
        onlineUrl:   onlineUrl || null,
        notes:       notes || null,
      })
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier la session</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nom de la session *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Niveau</label>
            <select
              aria-label="Niveau de la session"
              value={niveau}
              onChange={e => setNiveau(e.target.value as TrainingNiveau | '')}
              className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="">— Aucun niveau —</option>
              <option value="START">MIA Bronze – Niveau 1 (7H)</option>
              <option value="PRO">MIA Argent – Niveau 2 (14H)</option>
              <option value="EXPERT">MIA Or – Niveau 3 (21H)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date de début *</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Date de fin *</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Capacité max</label>
              <Input type="number" min="1" value={maxStudents} onChange={e => setMax(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tarif (€)</label>
              <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Ex: 2500" className="h-8 text-sm" />
            </div>
          </div>

          {trainers.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Formateur assigné</label>
              <select
                aria-label="Formateur assigné"
                value={trainerId}
                onChange={e => setTrainerId(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
              >
                <option value="">— Aucun —</option>
                {trainers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Lieu (présentiel)</label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Salle A3 — Paris" className="h-8 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Lien en ligne (distanciel)</label>
            <Input value={onlineUrl} onChange={e => setOnlineUrl(e.target.value)} placeholder="https://meet.google.com/..." className="h-8 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Informations visibles uniquement par l'admin…"
              className="w-full resize-none rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus:border-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Sauvegarde…</> : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function toDateInput(d: Date): string {
  return new Date(d).toISOString().split('T')[0]
}
