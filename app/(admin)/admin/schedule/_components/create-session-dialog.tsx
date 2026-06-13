'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createSession } from '@/app/actions/schedule'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { CirclePlus } from 'lucide-react'

interface Module  { id: string; title: string }
interface Room    { id: string; name: string; capacity: number }
interface CreateSessionDialogProps {
  modules: Module[]
  rooms: Room[]
  defaultDate?: Date
  onCreated?: () => void
}

export default function CreateSessionDialog({ modules, rooms, defaultDate, onCreated }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createSession, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setOpen(false)
      formRef.current?.reset()
      onCreated?.()
    }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <CirclePlus className="h-4 w-4" />
        Ajouter une séance
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter une séance</DialogTitle>
          <DialogDescription>Planifier une nouvelle séance de cours.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
          {/* Module */}
          <div className="flex flex-col gap-1.5">
            <Label>Module de conduite</Label>
            <Select name="moduleId" required labelItems={Object.fromEntries(modules.map(m => [m.id, m.title]))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un module…" />
              </SelectTrigger>
              <SelectContent className="min-w-80">
                {modules.length === 0
                  ? <SelectItem value="" disabled>Aucun module disponible</SelectItem>
                  : modules.map(m => <SelectItem key={m.id} value={m.id} label={m.title}>{m.title}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <DatePicker name="date" placeholder="Choisir une date" defaultValue={defaultDate} />
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">Heure de début</Label>
              <Input id="startTime" name="startTime" type="time" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime">Heure de fin</Label>
              <Input id="endTime" name="endTime" type="time" required />
            </div>
          </div>

          {/* Room (optional) */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Salle <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Select name="roomId" labelItems={Object.fromEntries(rooms.map(r => [r.id, r.name]))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sans salle" />
              </SelectTrigger>
              <SelectContent className="min-w-80">
                {rooms.map(r => (
                  <SelectItem key={r.id} value={r.id} label={r.name}>
                    {r.name} <span className="text-muted-foreground">· {r.capacity} places</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">
              Notes <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Input id="notes" name="notes" placeholder="Notes pour cette séance…" />
          </div>

          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
