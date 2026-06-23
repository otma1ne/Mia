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
import { UserPlus, Loader2, CheckCircle2, UploadCloud } from 'lucide-react'

const EXPERTISE_LEVEL_OPTIONS = [
  { value: 'DEBUTANT',      label: 'Débutant' },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
  { value: 'AVANCE',        label: 'Avancé' },
  { value: 'EXPERT',        label: 'Expert' },
]

interface FileUploadFieldProps {
  name: string
  label: string
  required?: boolean
}

function FileUploadField({ name, label, required }: FileUploadFieldProps) {
  const [url, setUrl]         = useState('')
  const [fileName, setFileName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)
    setUrl('')
    setFileName('')

    const body = new FormData()
    body.append('file', file)

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok || json.error) {
        setError(json.error ?? 'Erreur lors du téléversement.')
      } else {
        setUrl(json.url)
        setFileName(file.name)
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label} {!required && <span className="text-muted-foreground">(facultatif)</span>}
      </Label>
      <input type="hidden" name={name} value={url} />

      <div
        className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-muted-foreground/25 px-3 py-3 text-center cursor-pointer hover:border-primary/40 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : url ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-xs font-medium text-green-600 truncate max-w-full">{fileName}</p>
          </>
        ) : (
          <>
            <UploadCloud className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">PDF uniquement</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        aria-label={label}
        onChange={handleChange}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

interface CreateTrainerDialogProps {
  categories: { id: string; name: string }[]
}

export default function CreateTrainerDialog({ categories }: CreateTrainerDialogProps) {
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

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un formateur</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte formateur. Il pourra se connecter et gérer ses cours.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" placeholder="Alice" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" name="lastName" placeholder="Martin" required />
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

          {/* Type de formation — multiselect of existing categories */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Type de formation <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucune catégorie de formation disponible.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/5"
                  >
                    <input type="checkbox" name="categoryIds" value={c.id} className="accent-primary" />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Niveau d'expertise — multiselect */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Niveau d&apos;expertise <span className="text-muted-foreground">(facultatif)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_LEVEL_OPTIONS.map(level => (
                <label
                  key={level.value}
                  className="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/5"
                >
                  <input type="checkbox" name="expertiseLevels" value={level.value} className="accent-primary" />
                  {level.label}
                </label>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="grid grid-cols-2 gap-3">
            <FileUploadField name="cvUrl" label="CV" required />
            <FileUploadField name="diplomeUrl" label="Diplôme" required />
            <FileUploadField name="certifQualiopiUrl" label="Certif. Qualiopi" />
            <FileUploadField name="ndaUrl" label="NDA" />
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
