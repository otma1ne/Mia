'use client'

import { useState, useTransition } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CirclePlus, Loader2 } from 'lucide-react'
import { createTrainingSession } from '@/app/actions/training-sessions'
import type { TrainingNiveau } from '@prisma/client'
import { useRouter } from 'next/navigation'

interface Formation { id: string; title: string }
interface Trainer   { id: string; name: string }

interface Props {
  formations: Formation[]
  trainers:   Trainer[]
}

export default function CreateSessionFromListDialog({ formations, trainers }: Props) {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [formationId, setFormationId] = useState('')
  const [title, setTitle]             = useState('Promotion ')
  const [niveau, setNiveau]           = useState<TrainingNiveau | ''>('')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [maxStudents, setMax]         = useState('15')
  const [price, setPrice]             = useState('')
  const [trainerId, setTrainerId]     = useState('')
  const [location, setLocation]       = useState('')
  const [error, setError]             = useState('')
  const [isPending, startTransition]  = useTransition()

  function reset() {
    setFormationId(''); setTitle('Promotion '); setNiveau('')
    setStartDate(''); setEndDate(''); setMax('15'); setPrice('')
    setTrainerId(''); setLocation(''); setError('')
  }

  function handleClose() { reset(); setOpen(false) }

  function handleSubmit() {
    setError('')
    if (!formationId) { setError('Veuillez sélectionner une formation.'); return }
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
        status:      'DRAFT',
      })
      if (result.error) { setError(result.error); return }
      handleClose()
      router.refresh()
    })
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <CirclePlus className="h-4 w-4 mr-1.5" />
        Nouvelle session
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
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
              <label htmlFor="sl-formation" className="text-xs font-medium text-muted-foreground">Formation *</label>
              <select
                id="sl-formation"
                value={formationId}
                onChange={e => setFormationId(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus:border-ring"
              >
                <option value="">— Choisir une formation —</option>
                {formations.map(f => (
                  <option key={f.id} value={f.id}>{f.title}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sl-title" className="text-xs font-medium text-muted-foreground">Nom de la session *</label>
              <Input id="sl-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Promotion Janvier 2025" className="h-8 text-sm" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sl-niveau" className="text-xs font-medium text-muted-foreground">Niveau</label>
              <select
                id="sl-niveau"
                aria-label="Niveau"
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
                <label htmlFor="sl-trainer" className="text-xs font-medium text-muted-foreground">Formateur assigné</label>
                <select
                  id="sl-trainer"
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
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={handleClose}>Annuler</Button>
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Création…</> : 'Créer la session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
