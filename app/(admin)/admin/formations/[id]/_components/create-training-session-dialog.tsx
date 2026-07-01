'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { createTrainingSession, type TrainingSessionRow } from '@/app/actions/training-sessions'
import type { TrainingNiveau } from '@prisma/client'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (row: TrainingSessionRow) => void
  formationId: string
  trainers: { id: string; name: string }[]
}

export default function CreateTrainingSessionDialog({
  open, onClose, onCreated, formationId, trainers,
}: Props) {
  const [title, setTitle]           = useState('Promotion ')
  const [niveau, setNiveau]         = useState<TrainingNiveau | ''>('')
  const [startDate, setStartDate]   = useState('')
  const [endDate, setEndDate]       = useState('')
  const [maxStudents, setMax]       = useState('15')
  const [price, setPrice]           = useState('')
  const [trainerId, setTrainerId]   = useState('')
  const [location, setLocation]     = useState('')
  const [onlineUrl, setOnlineUrl]   = useState('')
  const [notes, setNotes]           = useState('')
  const [error, setError]           = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setTitle('Promotion '); setNiveau(''); setStartDate(''); setEndDate('')
    setMax('15'); setPrice(''); setTrainerId(''); setLocation('')
    setOnlineUrl(''); setNotes(''); setError('')
  }

  function handleClose() { reset(); onClose() }

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
      const result = await createTrainingSession(formationId, {
        title:       title.trim(),
        niveau:      niveau || null,
        startDate,
        endDate,
        maxStudents: parseInt(maxStudents) || 15,
        price:       price ? parseFloat(price) : null,
        trainerId:   trainerId || null,
        location:    location || null,
        onlineUrl:   onlineUrl || null,
        notes:       notes || null,
        status:      'DRAFT',
      })
      if (result.error) { setError(result.error); return }
      // Build a local row to avoid a refetch
      const trainer = trainers.find(t => t.id === trainerId)
      const row: TrainingSessionRow = {
        id:               crypto.randomUUID(),
        title:            title.trim(),
        niveau:           niveau || null,
        startDate:        new Date(startDate),
        endDate:          new Date(endDate),
        status:           'DRAFT',
        maxStudents:      parseInt(maxStudents) || 15,
        price:            price ? parseFloat(price) : null,
        location:         location || null,
        onlineUrl:        onlineUrl || null,
        notes:            notes || null,
        trainerId:        trainerId || null,
        trainerName:      trainer?.name ?? null,
        enrollmentCount:  0,
        inscriptionCount: 0,
      }
      onCreated(row)
      reset()
    })
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle session / promotion</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {error && (
            <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ts-title" className="text-xs font-medium text-muted-foreground">Nom de la session *</label>
            <Input id="ts-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Promotion Janvier 2025" className="h-8 text-sm" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ts-niveau" className="text-xs font-medium text-muted-foreground">Niveau</label>
            <select
              id="ts-niveau"
              aria-label="Niveau de la session"
              value={niveau}
              onChange={e => setNiveau(e.target.value as TrainingNiveau | '')}
              className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
            >
              <option value="">— Aucun niveau —</option>
              <option value="START">MIA Start – Niveau 1 (7H)</option>
              <option value="PRO">MIA Pro – Niveau 2 (14H)</option>
              <option value="EXPERT">MIA Expert – Niveau 3 (21H)</option>
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
              <label htmlFor="ts-trainer" className="text-xs font-medium text-muted-foreground">Formateur assigné</label>
              <select
                id="ts-trainer"
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
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: Salle A3 — Casablanca" className="h-8 text-sm" />
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
          <Button variant="outline" size="sm" onClick={handleClose}>Annuler</Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Création…</> : 'Créer la session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
