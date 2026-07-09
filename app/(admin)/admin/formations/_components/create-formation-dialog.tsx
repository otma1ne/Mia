'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createFormation } from '@/app/actions/formations'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CirclePlus } from 'lucide-react'

interface Category { id: string; name: string }

interface CreateFormationDialogProps {
  categories: Category[]
}

export default function CreateFormationDialog({ categories }: CreateFormationDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createFormation, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      formRef.current?.reset()
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <CirclePlus className="h-4 w-4" />
        Ajouter une formation
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter une formation</DialogTitle>
          <DialogDescription>
            Créez un nouveau programme de formation. Il sera enregistré comme brouillon.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" name="title" placeholder="Développement Web Full-Stack" required />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              rows={3}
              required
              placeholder="Que vont apprendre les étudiants ?"
              className="h-auto w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Thématique</Label>
              <Select name="categoryId" required labelItems={Object.fromEntries(categories.map(c => [c.id, c.name]))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent className="min-w-72">
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select name="type" required labelItems={{
                PRESENTIAL: 'Présentiel',
                REMOTE_LIVE: 'À distance — sessions live',
                REMOTE_ASYNC: 'À distance — asynchrone',
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent className="min-w-72">
                  <SelectItem value="PRESENTIAL" label="Présentiel">Présentiel</SelectItem>
                  <SelectItem value="REMOTE_LIVE" label="À distance — sessions live">À distance — sessions live</SelectItem>
                  <SelectItem value="REMOTE_ASYNC" label="À distance — asynchrone">À distance — asynchrone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Niveau + Code RS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>Niveau</Label>
              <Select name="niveau" labelItems={{ START: 'MIA Start', PRO: 'MIA Pro', EXPERT: 'MIA Expert' }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="START" label="MIA Start">MIA Start</SelectItem>
                  <SelectItem value="PRO" label="MIA Pro">MIA Pro</SelectItem>
                  <SelectItem value="EXPERT" label="MIA Expert">MIA Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="codeRS">Code RS</Label>
              <Input id="codeRS" name="codeRS" placeholder="RS1234" />
            </div>
          </div>

          {/* Capacity */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="maxStudents">Capacité max</Label>
            <Input id="maxStudents" name="maxStudents" type="number" min="1" placeholder="20" required />
          </div>

          {/* Price + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Tarif (€)</Label>
              <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="5000" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="duration">Durée (heures)</Label>
              <Input id="duration" name="duration" type="number" min="1" placeholder="120" />
            </div>
          </div>

          {/* Programme */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="programme">Programme de formation</Label>
            <textarea
              id="programme"
              name="programme"
              rows={6}
              placeholder="Décrivez le contenu détaillé du programme…"
              className="h-auto w-full min-w-0 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Création…' : 'Créer la formation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
