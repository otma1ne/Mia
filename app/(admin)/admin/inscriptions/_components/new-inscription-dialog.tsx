'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  adminCreateDirectEnrollment,
  adminLaunchInscriptionWorkflow,
} from '@/app/actions/admin-inscriptions'

interface Student      { id: string; name: string; email: string }
interface Formation    { id: string; title: string }
interface TrainingSession { id: string; title: string; formationId: string }

interface Props {
  students:  Student[]
  formations: Formation[]
  sessions:   TrainingSession[]
}

export default function NewInscriptionDialog({ students, formations, sessions }: Props) {
  const [open, setOpen]   = useState(false)
  const [tab, setTab]     = useState<'direct' | 'workflow'>('direct')
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  // Direct tab
  const [studentSearch,    setStudentSearch]    = useState('')
  const [studentOpen,      setStudentOpen]      = useState(false)
  const [directStudentId,  setDirectStudentId]  = useState('')
  const [directStudentLabel, setDirectStudentLabel] = useState('')
  const [directFormationId, setDirectFormationId] = useState('')
  const [directSessionId,  setDirectSessionId]  = useState('')

  // Workflow tab
  const [wkFirstName,   setWkFirstName]   = useState('')
  const [wkLastName,    setWkLastName]    = useState('')
  const [wkEmail,       setWkEmail]       = useState('')
  const [wkPhone,       setWkPhone]       = useState('')
  const [wkNationality, setWkNationality] = useState('')
  const [wkDob,         setWkDob]         = useState('')
  const [wkFormationId, setWkFormationId] = useState('')
  const [wkSessionId,   setWkSessionId]   = useState('')

  function reset() {
    setStudentSearch(''); setStudentOpen(false)
    setDirectStudentId(''); setDirectStudentLabel('')
    setDirectFormationId(''); setDirectSessionId('')
    setWkFirstName(''); setWkLastName(''); setWkEmail('')
    setWkPhone(''); setWkNationality(''); setWkDob('')
    setWkFormationId(''); setWkSessionId('')
    setError(''); setSuccess('')
  }

  const filteredStudents = studentSearch
    ? students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students

  const directSessions = sessions.filter(s => s.formationId === directFormationId)
  const wkSessions     = sessions.filter(s => s.formationId === wkFormationId)

  function handleDirect() {
    if (!directStudentId || !directFormationId) {
      setError('Sélectionnez un étudiant et une formation.')
      return
    }
    setError(''); setSuccess('')
    startTransition(async () => {
      const res = await adminCreateDirectEnrollment(
        directStudentId,
        directFormationId,
        directSessionId || undefined,
      )
      if (res.success) {
        setSuccess('Étudiant inscrit avec succès.')
        setTimeout(() => { setOpen(false); reset() }, 1600)
      } else {
        setError(res.error ?? 'Une erreur est survenue.')
      }
    })
  }

  function handleWorkflow() {
    if (!wkFirstName || !wkLastName || !wkEmail || !wkPhone || !wkNationality || !wkDob || !wkFormationId) {
      setError('Veuillez renseigner tous les champs obligatoires.')
      return
    }
    setError(''); setSuccess('')
    startTransition(async () => {
      const res = await adminLaunchInscriptionWorkflow({
        firstName:   wkFirstName,
        lastName:    wkLastName,
        email:       wkEmail,
        phone:       wkPhone,
        nationality: wkNationality,
        dateOfBirth: wkDob,
        formationId: wkFormationId,
        trainingSessionId: wkSessionId || undefined,
      })
      if (res.success) {
        setSuccess('Formulaire d\'évaluation envoyé au candidat.')
        setTimeout(() => { setOpen(false); reset() }, 1800)
      } else {
        setError(res.error ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        Nouvelle inscription
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une inscription</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => { setTab(v as 'direct' | 'workflow'); setError(''); setSuccess('') }}>
          <TabsList className="w-full">
            <TabsTrigger value="direct"   className="flex-1 text-xs">Inscription directe</TabsTrigger>
            <TabsTrigger value="workflow" className="flex-1 text-xs">Lancer le workflow</TabsTrigger>
          </TabsList>

          {/* ── Direct enrollment ───────────────────────────────── */}
          <TabsContent value="direct" className="flex flex-col gap-4 mt-3">
            <p className="text-xs text-muted-foreground">
              Inscrit immédiatement un étudiant existant dans une formation, sans passer par le processus d'évaluation et de signature.
            </p>

            {/* Student picker */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Étudiant <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Rechercher par nom ou email…"
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); setStudentOpen(true); setDirectStudentId('') }}
                onFocus={() => setStudentOpen(true)}
                className="h-8 text-sm"
              />
              {studentOpen && studentSearch && (
                <div className="max-h-36 overflow-y-auto rounded-lg border bg-popover shadow-sm divide-y">
                  {filteredStudents.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-muted-foreground text-center">Aucun résultat.</p>
                  ) : filteredStudents.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setDirectStudentId(s.id)
                        setDirectStudentLabel(`${s.name}`)
                        setStudentSearch(`${s.name} — ${s.email}`)
                        setStudentOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors',
                        directStudentId === s.id && 'bg-muted',
                      )}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{s.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {directStudentId && (
                <p className="text-xs text-emerald-600">✓ {directStudentLabel} sélectionné</p>
              )}
            </div>

            {/* Formation */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Formation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={directFormationId}
                onValueChange={v => { setDirectFormationId(v as string); setDirectSessionId('') }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sélectionner une formation…" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Training session (optional) */}
            {directSessions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Promotion (optionnel)</Label>
                <Select value={directSessionId} onValueChange={v => setDirectSessionId(v as string)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Aucune promotion" />
                  </SelectTrigger>
                  <SelectContent>
                    {directSessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Feedback error={error} success={success} />

            <Button onClick={handleDirect} disabled={isPending} size="sm" className="w-full">
              {isPending ? 'Inscription en cours…' : 'Inscrire directement'}
            </Button>
          </TabsContent>

          {/* ── Workflow ─────────────────────────────────────────── */}
          <TabsContent value="workflow" className="flex flex-col gap-4 mt-3">
            <p className="text-xs text-muted-foreground">
              Crée une demande d'inscription et envoie un formulaire d'évaluation au candidat par email.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" required>
                <Input value={wkFirstName} onChange={e => setWkFirstName(e.target.value)} className="h-8 text-sm" placeholder="Mohamed" />
              </Field>
              <Field label="Nom" required>
                <Input value={wkLastName} onChange={e => setWkLastName(e.target.value)} className="h-8 text-sm" placeholder="Alami" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" required>
                <Input type="email" value={wkEmail} onChange={e => setWkEmail(e.target.value)} className="h-8 text-sm" placeholder="email@example.com" />
              </Field>
              <Field label="Téléphone" required>
                <Input type="tel" value={wkPhone} onChange={e => setWkPhone(e.target.value)} className="h-8 text-sm" placeholder="+212 6…" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Nationalité" required>
                <Input value={wkNationality} onChange={e => setWkNationality(e.target.value)} className="h-8 text-sm" placeholder="Marocaine" />
              </Field>
              <Field label="Date de naissance" required>
                <Input type="date" value={wkDob} onChange={e => setWkDob(e.target.value)} className="h-8 text-sm" />
              </Field>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">
                Formation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={wkFormationId}
                onValueChange={v => { setWkFormationId(v as string); setWkSessionId('') }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Sélectionner une formation…" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {wkSessions.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Promotion (optionnel)</Label>
                <Select value={wkSessionId} onValueChange={v => setWkSessionId(v as string)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Aucune promotion" />
                  </SelectTrigger>
                  <SelectContent>
                    {wkSessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Feedback error={error} success={success} />

            <Button onClick={handleWorkflow} disabled={isPending} size="sm" className="w-full">
              {isPending ? 'Envoi en cours…' : 'Envoyer le formulaire d\'évaluation'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}

function Feedback({ error, success }: { error: string; success: string }) {
  if (error)   return <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</p>
  if (success) return <p className="flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle className="h-3.5 w-3.5 shrink-0" />{success}</p>
  return null
}
