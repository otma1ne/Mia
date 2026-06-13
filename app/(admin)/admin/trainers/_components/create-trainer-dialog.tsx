'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createTrainer } from '@/app/actions/trainers'
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
import { UserPlus } from 'lucide-react'

export default function CreateTrainerDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createTrainer, null)
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
        <UserPlus className="h-4 w-4" />
        Ajouter un formateur
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un formateur</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte formateur. Il pourra se connecter et gérer ses cours.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" placeholder="Alice Martin" required />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" placeholder="alice@exemple.com" required />
            </div>

            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="phone">
                Téléphone <span className="text-muted-foreground">(facultatif)</span>
              </Label>
              <Input id="phone" name="phone" type="tel" placeholder="+33 6 00 00 00 00" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">
              Biographie <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <Input id="bio" name="bio" placeholder="Courte biographie professionnelle…" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="specializations">
              Spécialisations <span className="text-muted-foreground">(séparées par des virgules)</span>
            </Label>
            <Input
              id="specializations"
              name="specializations"
              placeholder="JavaScript, React, Node.js"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="credentials">
              Diplômes &amp; certifications <span className="text-muted-foreground">(séparés par des virgules)</span>
            </Label>
            <Input
              id="credentials"
              name="credentials"
              placeholder="Licence informatique, AWS Certified"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Création…' : 'Créer le formateur'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
