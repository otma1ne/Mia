'use client'

import { useActionState, useRef, useState } from 'react'
import { createTrainerApplication } from '@/app/actions/trainer-applications'
import type { ApplicationSkill } from '@/app/actions/trainer-applications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, FileText, X } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import SkillSelector from '@/app/rejoindre-notre-equipe/_components/skill-selector'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
      {pending
        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
        : 'Envoyer ma candidature'}
    </Button>
  )
}

interface TrainerApplicationFormProps {
  skills: { id: string; name: string }[]
}

export default function TrainerApplicationForm({ skills }: TrainerApplicationFormProps) {
  const [state, action]           = useActionState(createTrainerApplication, undefined)
  const [selectedSkills, setSelectedSkills] = useState<ApplicationSkill[]>([])

  // CV upload
  const [cvUrl, setCvUrl]         = useState('')
  const [cvName, setCvName]       = useState('')
  const [cvUploading, setCvUploading] = useState(false)
  const [cvError, setCvError]     = useState('')
  const cvRef                     = useRef<HTMLInputElement>(null)

  // Diplomas upload
  const [diplomeUrls, setDiplomeUrls] = useState<string[]>([])
  const [diplomeNames, setDiplomeNames] = useState<string[]>([])
  const [diplomeUploading, setDiplomeUploading] = useState(false)
  const [diplomeError, setDiplomeError] = useState('')
  const diplomeRef = useRef<HTMLInputElement>(null)

  async function uploadFile(
    file: File,
    onSuccess: (url: string, name: string) => void,
    setUploading: (v: boolean) => void,
    setError: (e: string) => void
  ) {
    setError('')
    setUploading(true)
    const body = new FormData()
    body.append('file', file)
    try {
      const res  = await fetch('/api/upload-cv', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error ?? 'Erreur lors du téléchargement.')
      } else {
        onSuccess(json.url, file.name)
      }
    } catch {
      setError('Erreur réseau, veuillez réessayer.')
    } finally {
      setUploading(false)
    }
  }

  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file, (url, name) => { setCvUrl(url); setCvName(name) }, setCvUploading, setCvError)
  }

  async function handleDiplomeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (diplomeUrls.length >= 5) { setDiplomeError('Maximum 5 diplômes.'); return }
    await uploadFile(
      file,
      (url, name) => {
        setDiplomeUrls(prev => [...prev, url])
        setDiplomeNames(prev => [...prev, name])
      },
      setDiplomeUploading,
      setDiplomeError
    )
    if (diplomeRef.current) diplomeRef.current.value = ''
  }

  function removeDiplome(index: number) {
    setDiplomeUrls(prev => prev.filter((_, i) => i !== index))
    setDiplomeNames(prev => prev.filter((_, i) => i !== index))
  }

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-500" />
        <h2 className="text-2xl font-semibold">Candidature envoyée !</h2>
        <p className="text-muted-foreground max-w-sm">
          Notre équipe examinera votre dossier et vous contactera sous 48h.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-8">
      {/* Hidden fields for file URLs and skills JSON */}
      <input type="hidden" name="cvUrl"       value={cvUrl} />
      <input type="hidden" name="diplomeUrls" value={JSON.stringify(diplomeUrls)} />
      <input type="hidden" name="skills"      value={JSON.stringify(selectedSkills)} />

      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Informations personnelles */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">① Informations personnelles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom <span className="text-destructive">*</span></Label>
            <Input id="firstName" name="firstName" required placeholder="Jean" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom <span className="text-destructive">*</span></Label>
            <Input id="lastName" name="lastName" required placeholder="Dupont" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
            <Input id="email" name="email" type="email" required placeholder="jean.dupont@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone <span className="text-destructive">*</span></Label>
            <Input id="phone" name="phone" type="tel" required placeholder="+33 6 XX XX XX XX" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="city">Ville <span className="text-destructive">*</span></Label>
            <Input id="city" name="city" required placeholder="Paris" />
          </div>
        </div>
      </section>

      {/* Documents */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">② Documents</h2>

        {/* CV */}
        <div className="space-y-2">
          <Label>CV (PDF) <span className="text-destructive">*</span></Label>
          {cvUrl ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-violet-600 shrink-0" />
              <span className="flex-1 truncate">{cvName}</span>
              <button type="button" onClick={() => { setCvUrl(''); setCvName(''); if (cvRef.current) cvRef.current.value = '' }} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-8 cursor-pointer hover:border-violet-400 transition-colors">
              {cvUploading
                ? <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
              <span className="text-sm text-muted-foreground">
                {cvUploading ? 'Téléchargement…' : 'Cliquez pour déposer votre CV (PDF)'}
              </span>
              <input ref={cvRef} type="file" accept=".pdf" className="sr-only" onChange={handleCvChange} />
            </label>
          )}
          {cvError && <p className="text-sm text-destructive">{cvError}</p>}
        </div>

        {/* Diplomas */}
        <div className="space-y-2">
          <Label>Diplômes <span className="text-xs font-normal text-muted-foreground">(facultatif, max 5 PDF)</span></Label>
          {diplomeNames.map((name, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-violet-600 shrink-0" />
              <span className="flex-1 truncate">{name}</span>
              <button type="button" onClick={() => removeDiplome(i)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {diplomeUrls.length < 5 && (
            <label className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 cursor-pointer hover:border-violet-400 transition-colors">
              {diplomeUploading
                ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                : <UploadCloud className="h-4 w-4 text-muted-foreground" />}
              <span className="text-sm text-muted-foreground">
                {diplomeUploading ? 'Téléchargement…' : 'Ajouter un diplôme (PDF)'}
              </span>
              <input ref={diplomeRef} type="file" accept=".pdf" className="sr-only" onChange={handleDiplomeChange} />
            </label>
          )}
          {diplomeError && <p className="text-sm text-destructive">{diplomeError}</p>}
        </div>
      </section>

      {/* Compétences */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">③ Compétences <span className="text-destructive">*</span></h2>
        <p className="text-sm text-muted-foreground">Sélectionnez vos compétences et indiquez votre niveau pour chacune.</p>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune compétence disponible pour le moment.</p>
        ) : (
          <SkillSelector skills={skills} onChange={setSelectedSkills} />
        )}
      </section>

      {/* Présentation */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">④ Présentation <span className="text-destructive">*</span></h2>
        <div className="space-y-1.5">
          <Label htmlFor="bio">Présentez-vous en quelques lignes</Label>
          <Textarea
            id="bio"
            name="bio"
            required
            rows={5}
            placeholder="Décrivez votre parcours, votre expérience pédagogique, vos domaines d'intervention…"
            className="resize-none"
          />
        </div>
      </section>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
