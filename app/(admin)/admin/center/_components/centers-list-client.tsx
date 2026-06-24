'use client'

import { useState, useTransition } from 'react'
import { deleteCenter } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Building2, CirclePlus, MapPin, Phone, Mail,
  Trash2, Settings, DoorOpen,
} from 'lucide-react'
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
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label="Supprimer"
        />
      }>
        <Trash2 className="h-3.5 w-3.5" />
        Supprimer
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
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
      <DialogTrigger render={<Button className="gap-2" />}>
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
        <div className="py-2">
          <CenterInfoForm center={null} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function CentersListClient({ centers }: CentersListClientProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Centres de formation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {centers.length === 0
              ? 'Aucun centre configuré.'
              : `${centers.length} centre${centers.length !== 1 ? 's' : ''} enregistré${centers.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <CreateCenterDialog />
      </div>

      {/* Empty state */}
      {centers.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Aucun centre pour l&apos;instant</p>
            <p className="text-xs text-muted-foreground mt-1">Créez votre premier centre pour commencer.</p>
          </div>
          <CreateCenterDialog />
        </div>
      )}

      {/* Cards grid */}
      {centers.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map(center => (
            <div
              key={center.id}
              className="group relative flex flex-col rounded-2xl border bg-card overflow-hidden"
            >
              {/* Color band */}
              <div className="h-1 bg-linear-to-r from-indigo-500 to-indigo-400" />

              {/* Body */}
              <div className="flex flex-col gap-4 p-5 flex-1">
                {/* Icon + name */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-tight truncate">{center.name}</p>
                    <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      <DoorOpen className="h-3 w-3" />
                      {center._count.rooms} salle{center._count.rooms !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Contact details */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{center.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{center.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{center.email}</span>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-between border-t px-4 py-2.5 bg-muted/30">
                <DeleteCenterDialog center={center} />
                <Link
                  href={`/admin/center/${center.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Configurer
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
