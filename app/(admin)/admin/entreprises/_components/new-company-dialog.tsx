'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, CheckCircle2, AlertCircle, Building2 } from 'lucide-react'
import { createCompany } from '@/app/actions/companies'

function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {!required && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(facultatif)</span>
        )}
      </Label>
      {children}
    </div>
  )
}

type Feedback = { type: 'error' | 'success'; message: string } | null

export default function NewCompanyDialog() {
  const [open, setOpen]           = useState(false)
  const [feedback, setFeedback]   = useState<Feedback>(null)
  const [isPending, startTransition] = useTransition()

  function reset() {
    setFeedback(null)
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)
    const fd = new FormData(e.currentTarget)

    const data = {
      raisonSociale:    fd.get('raisonSociale')    as string,
      nomSignataire:    fd.get('nomSignataire')     as string,
      prenomSignataire: fd.get('prenomSignataire')  as string,
      fonction:         fd.get('fonction')           as string,
      email:            fd.get('email')              as string,
      phone:            fd.get('phone')              as string,
      siret:            (fd.get('siret')       as string) || undefined,
      adresse:          (fd.get('adresse')     as string) || undefined,
      ville:            (fd.get('ville')       as string) || undefined,
      codePostal:       (fd.get('codePostal')  as string) || undefined,
    }

    startTransition(async () => {
      const result = await createCompany(data)
      if (result.success) {
        setFeedback({ type: 'success', message: 'Espace entreprise créé. Les identifiants ont été envoyés au signataire.' })
        ;(e.target as HTMLFormElement).reset()
      } else {
        setFeedback({ type: 'error', message: result.error ?? 'Une erreur est survenue.' })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Nouvelle entreprise
      </DialogTrigger>

      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Building2 className="h-4 w-4 text-blue-600" />
            </div>
            <DialogTitle>Créer un espace entreprise</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          {/* Feedback */}
          {feedback && (
            <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              {feedback.message}
            </div>
          )}

          {/* Entreprise */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entreprise</p>
            <Field id="raisonSociale" label="Raison sociale" required>
              <Input id="raisonSociale" name="raisonSociale" placeholder="MIA Consulting SARL" required />
            </Field>
            <Field id="siret" label="SIRET">
              <Input id="siret" name="siret" placeholder="12345678900012" />
            </Field>
            <Field id="adresse" label="Adresse">
              <Input id="adresse" name="adresse" placeholder="45 rue des Lilas" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="ville" label="Ville">
                <Input id="ville" name="ville" placeholder="Paris" />
              </Field>
              <Field id="codePostal" label="Code postal">
                <Input id="codePostal" name="codePostal" placeholder="75011" />
              </Field>
            </div>
          </div>

          {/* Signataire */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Signataire / Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <Field id="prenomSignataire" label="Prénom" required>
                <Input id="prenomSignataire" name="prenomSignataire" placeholder="Karim" required />
              </Field>
              <Field id="nomSignataire" label="Nom" required>
                <Input id="nomSignataire" name="nomSignataire" placeholder="Benali" required />
              </Field>
            </div>
            <Field id="fonction" label="Fonction" required>
              <Input id="fonction" name="fonction" placeholder="Directeur général" required />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="email" label="Email" required>
                <Input id="email" name="email" type="email" placeholder="k.benali@entreprise.ma" required />
              </Field>
              <Field id="phone" label="Téléphone" required>
                <Input id="phone" name="phone" type="tel" placeholder="+33 6 XX XX XX XX" required />
              </Field>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            Un compte manager sera créé automatiquement avec les identifiants envoyés par email.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création…</> : 'Créer l\'espace'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
