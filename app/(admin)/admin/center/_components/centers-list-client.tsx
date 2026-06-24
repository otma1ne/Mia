'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCenter } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Building2, ChevronRight, CirclePlus, MapPin, Phone, Trash2 } from 'lucide-react'
import Link from 'next/link'
import CenterInfoForm from './center-info-form'

interface CenterItem {
  id: string
  name: string
  address: string
  phone: string
  email: string
  _count: { rooms: number }
}

interface CentersListClientProps {
  centers: CenterItem[]
}

function DeleteCenterDialog({ center }: { center: CenterItem }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCenter(center.id)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Supprimer"
        />
      }>
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Supprimer le centre</DialogTitle>
          <DialogDescription>
            Voulez-vous vraiment supprimer <strong>{center.name}</strong> ?
            Les salles et horaires associés seront également supprimés. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
            {isPending ? 'Suppression…' : 'Supprimer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateCenterDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <CirclePlus className="h-4 w-4" />
        Ajouter un centre
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau centre</DialogTitle>
          <DialogDescription>
            Renseignez les informations du nouveau centre. Vous pourrez ensuite configurer les salles, horaires et documents.
          </DialogDescription>
        </DialogHeader>
        {/* CenterInfoForm with center=null → creates, then redirects to /admin/center/[id] */}
        <div className="py-2">
          <CenterInfoForm center={null} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CentersListClient({ centers }: CentersListClientProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {centers.length} centre{centers.length !== 1 ? 's' : ''}
        </p>
        <CreateCenterDialog />
      </div>

      {/* List */}
      {centers.length === 0 ? (
        <Card className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Building2 className="h-8 w-8 opacity-40" />
          <p className="text-sm">Aucun centre configuré. Commencez par en créer un.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {centers.map(center => (
            <Card key={center.id} className="flex items-center gap-4 px-5 py-4">
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{center.name}</p>
                <div className="flex items-center gap-4 mt-0.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {center.address}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    {center.phone}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {center._count.rooms} salle{center._count.rooms !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <DeleteCenterDialog center={center} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  render={<Link href={`/admin/center/${center.id}`} aria-label="Configurer" />}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
