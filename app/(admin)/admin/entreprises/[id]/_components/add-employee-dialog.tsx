'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { addCompanyEmployee } from '@/app/actions/companies'

function Field({ id, label, required, children }: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {!required && <span className="ml-1 text-xs font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      {children}
    </div>
  )
}

export default function AddEmployeeDialog({ companyId }: { companyId: string }) {
  const [open, setOpen]     = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) setFeedback(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await addCompanyEmployee(companyId, {
        firstName: fd.get('firstName') as string,
        lastName:  fd.get('lastName')  as string,
        email:     (fd.get('email') as string) || undefined,
        phone:     (fd.get('phone') as string) || undefined,
      })
      if (result.success) {
        setFeedback({ type: 'success', message: 'Salarié ajouté.' })
        ;(e.target as HTMLFormElement).reset()
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Erreur.' })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <UserPlus className="h-4 w-4" />
        Ajouter un salarié
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un salarié</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {feedback && (
            <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {feedback.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              {feedback.message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field id="firstName" label="Prénom" required>
              <Input id="firstName" name="firstName" placeholder="Amine" required />
            </Field>
            <Field id="lastName" label="Nom" required>
              <Input id="lastName" name="lastName" placeholder="Tazi" required />
            </Field>
          </div>

          <Field id="email" label="Email">
            <Input id="email" name="email" type="email" placeholder="a.tazi@entreprise.ma" />
          </Field>

          <Field id="phone" label="Téléphone">
            <Input id="phone" name="phone" type="tel" placeholder="+212 6XX XXX XXX" />
          </Field>

          <p className="text-xs text-muted-foreground">
            Si un email est fourni, un compte étudiant sera créé automatiquement.
          </p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ajout…</> : 'Ajouter'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
