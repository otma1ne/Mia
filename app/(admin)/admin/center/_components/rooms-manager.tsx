'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createRoom, deleteRoom } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { DoorOpen, CirclePlus, Trash2, Users } from 'lucide-react'

interface Room {
  id: string
  name: string
  capacity: number
}

interface RoomsManagerProps {
  centerId: string
  initialRooms: Room[]
}

export default function RoomsManager({ centerId, initialRooms }: RoomsManagerProps) {
  const [rooms, setRooms]             = useState<Room[]>(initialRooms)
  const [addOpen, setAddOpen]         = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [isDeleting, setIsDeleting]   = useState(false)

  const [state, action, pending] = useActionState(createRoom, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setAddOpen(false)
      formRef.current?.reset()
      // Optimistic update not possible without new id — rely on server revalidation
      // The page will re-fetch on next navigation; for now close is enough
    }
  }, [state])

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteRoom(deleteTarget.id)
    setRooms(prev => prev.filter(r => r.id !== deleteTarget.id))
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <Card className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Salles</h2>
              <p className="text-xs text-muted-foreground">Gérer les salles et leurs capacités</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <CirclePlus className="h-4 w-4" />
            Ajouter une salle
          </Button>
        </div>

        {rooms.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 flex flex-col items-center gap-2 text-center">
            <DoorOpen className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune salle ajoutée pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rooms.map(room => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{room.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="h-3 w-3" />
                    {room.capacity} places
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(room)}
                  className="ml-2 shrink-0 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  aria-label={`Delete ${room.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add room dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une salle</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle salle de cours ou de formation.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
            <input type="hidden" name="centerId" value={centerId} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="roomName">Nom de la salle</Label>
              <Input id="roomName" name="name" placeholder="Salle 101" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="capacity">Capacité</Label>
              <Input id="capacity" name="capacity" type="number" min="1" placeholder="30" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Ajout…' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Supprimer la salle</DialogTitle>
            <DialogDescription>
              Supprimer <strong>{deleteTarget?.name}</strong> ? Les séances assignées à cette salle perdront leur assignation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
