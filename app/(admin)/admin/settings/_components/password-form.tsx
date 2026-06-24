'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { changePassword } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Check, Lock } from 'lucide-react'

export default function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null)
  const [saved, setSaved] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setSaved(true)
      formRef.current?.reset()
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <Card className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Changer le mot de passe</h2>
          <p className="text-xs text-muted-foreground">Choisissez un mot de passe fort d&apos;au moins 8 caractères</p>
        </div>
      </div>

      <form ref={formRef} action={action} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="current">Mot de passe actuel</Label>
          <Input id="current" name="current" type="password" autoComplete="current-password" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="next">Nouveau mot de passe</Label>
            <Input id="next" name="next" type="password" autoComplete="new-password" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
          </div>
        </div>

        {state?.error   && <p className="text-sm text-destructive">{state.error}</p>}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending} className="gap-1.5">
            {saved ? <><Check className="h-4 w-4" /> Mis à jour</> : pending ? 'Mise à jour…' : 'Mettre à jour'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
