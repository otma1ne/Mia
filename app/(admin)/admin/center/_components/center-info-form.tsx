'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveCenterInfo } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Building2, Check } from 'lucide-react'
import { useState } from 'react'

interface CenterInfoFormProps {
  center: {
    id: string
    name: string
    address: string
    phone: string
    email: string
    description: string
    enrollmentAlertDays: number
  } | null
}

export default function CenterInfoForm({ center }: CenterInfoFormProps) {
  const router = useRouter()
  const [state, action, pending] = useActionState(saveCenterInfo, null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (state?.success) {
      if (!center && state.centerId) {
        // New center created — redirect to its detail page
        router.replace(`/admin/center/${state.centerId}`)
      } else {
        setSaved(true)
        const t = setTimeout(() => setSaved(false), 2500)
        return () => clearTimeout(t)
      }
    }
  }, [state])

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Informations du centre</h2>
          <p className="text-xs text-muted-foreground">Informations de base sur votre centre de formation</p>
        </div>
      </div>

      <form action={action} className="flex flex-col gap-4">
        {/* hidden id */}
        {center && <input type="hidden" name="centerId" value={center.id} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nom du centre</Label>
            <Input id="name" name="name" defaultValue={center?.name ?? ''} placeholder="Centre de Formation" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={center?.email ?? ''} placeholder="contact@centre.ma" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" defaultValue={center?.phone ?? ''} placeholder="+33 1 00 00 00 00" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" defaultValue={center?.address ?? ''} placeholder="1 rue de la Paix, Paris, France" required />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description">
            Description <span className="text-muted-foreground">(facultatif)</span>
          </Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={center?.description ?? ''}
            placeholder="Une brève description de votre centre…"
            className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="enrollmentAlertDays">Délai d&apos;alerte inscription</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            Nombre de jours avant le début d&apos;une formation pour déclencher une alerte d&apos;inscription.
          </p>
          <div className="relative w-40">
            <Input
              id="enrollmentAlertDays"
              name="enrollmentAlertDays"
              type="number"
              min={1}
              max={365}
              defaultValue={center?.enrollmentAlertDays ?? 7}
              className="pr-14"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              jours
            </span>
          </div>
        </div>

        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="gap-1.5">
            {saved ? (
              <><Check className="h-4 w-4" /> Enregistré</>
            ) : pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
