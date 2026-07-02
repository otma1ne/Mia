'use client'

import { useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createInscription } from '@/app/actions/inscriptions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Loader2, UploadCloud } from 'lucide-react'
import type { Formation } from '@prisma/client'

interface RegisterFormProps {
  formations: Pick<Formation, 'id' | 'title'>[]
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {pending ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
      ) : (
        'Envoyer ma demande'
      )}
    </Button>
  )
}

export default function RegisterForm({ formations }: RegisterFormProps) {
  const [state, action] = useActionState(createInscription, undefined)
  const [cvUrl, setCvUrl]         = useState('')
  const [cvName, setCvName]       = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setUploading(true)
    setCvUrl('')
    setCvName('')

    const body = new FormData()
    body.append('file', file)

    try {
      const res  = await fetch('/api/upload-cv', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok || json.error) {
        setUploadError(json.error ?? 'Erreur lors du téléchargement.')
      } else {
        setCvUrl(json.url)
        setCvName(file.name)
      }
    } catch {
      setUploadError('Erreur réseau, veuillez réessayer.')
    } finally {
      setUploading(false)
    }
  }

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <h2 className="text-xl font-semibold">Demande envoyée !</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Veuillez consulter votre email pour compléter l&apos;évaluation de besoins.
          Le lien est valable <strong>24 heures</strong>.
        </p>
        <Link href="/login" className="text-primary text-sm font-medium hover:underline">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" type="text" required placeholder="Prénom" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" type="text" required placeholder="Nom" />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" required placeholder="vous@exemple.com" autoComplete="email" />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" type="tel" required placeholder="+33 6 XX XX XX XX" />
      </div>

      {/* Nationality + Date of birth row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="nationality">Nationalité</Label>
          <Input id="nationality" name="nationality" type="text" required placeholder="Française" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateOfBirth">Date de naissance</Label>
          <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        </div>
      </div>

      {/* Postal address */}
      <div className="space-y-1.5">
        <Label htmlFor="postalAddress">Adresse postale</Label>
        <Input id="postalAddress" name="postalAddress" type="text" placeholder="Adresse postale (facultatif)" />
      </div>

      {/* Pôle emploi ID */}
      <div className="space-y-1.5">
        <Label htmlFor="poleEmploiId">Identifiant Pôle emploi</Label>
        <Input id="poleEmploiId" name="poleEmploiId" type="text" placeholder="Identifiant Pôle emploi (facultatif)" />
      </div>

      {/* Formation */}
      <div className="space-y-1.5">
        <Label htmlFor="formationId">Formation souhaitée</Label>
        <Select name="formationId" required labelItems={Object.fromEntries(formations.map(f => [f.id, f.title]))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner une formation" />
          </SelectTrigger>
          <SelectContent className="min-w-80">
            {formations.map(f => (
              <SelectItem key={f.id} value={f.id} label={f.title}>{f.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* CV upload */}
      <div className="space-y-1.5">
        <Label>CV (PDF, max 5 Mo)</Label>
        <input type="hidden" name="cvUrl" value={cvUrl} />

        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-4 py-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : cvUrl ? (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <p className="text-sm font-medium text-green-600">{cvName}</p>
              <p className="text-xs text-muted-foreground">Cliquez pour changer</p>
            </>
          ) : (
            <>
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cliquez pour télécharger votre CV</p>
              <p className="text-xs text-muted-foreground">PDF uniquement</p>
            </>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          aria-label="Télécharger votre CV (PDF)"
          onChange={handleCvChange}
        />

        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}
      </div>

      <SubmitButton />

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  )
}
