'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, CheckCircle, AlertCircle, UserCheck, Mail, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  adminCreateDirectEnrollment,
  adminLaunchInscriptionWorkflow,
} from '@/app/actions/admin-inscriptions'

interface Student      { id: string; name: string; email: string }
interface Formation    { id: string; title: string }
interface TrainingSession { id: string; title: string; formationId: string }

interface Props {
  students:   Student[]
  formations: Formation[]
  sessions:   TrainingSession[]
}

type Mode = 'direct' | 'workflow'

export default function NewInscriptionDialog({ students, formations, sessions }: Props) {
  const [open, setOpen]   = useState(false)
  const [mode, setMode]   = useState<Mode>('direct')
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  // ── Direct mode state ──────────────────────────────────────────
  const [studentSearch,     setStudentSearch]     = useState('')
  const [dropdownOpen,      setDropdownOpen]      = useState(false)
  const [directStudentId,   setDirectStudentId]   = useState('')
  const [directStudentName, setDirectStudentName] = useState('')
  const [directFormationId, setDirectFormationId] = useState('')
  const [directSessionId,   setDirectSessionId]   = useState('')

  // ── Workflow mode state ────────────────────────────────────────
  const [wkFirstName,   setWkFirstName]   = useState('')
  const [wkLastName,    setWkLastName]    = useState('')
  const [wkEmail,       setWkEmail]       = useState('')
  const [wkPhone,       setWkPhone]       = useState('')
  const [wkNationality, setWkNationality] = useState('')
  const [wkDob,         setWkDob]         = useState('')
  const [wkFormationId, setWkFormationId] = useState('')
  const [wkSessionId,   setWkSessionId]   = useState('')

  function reset() {
    setStudentSearch(''); setDropdownOpen(false)
    setDirectStudentId(''); setDirectStudentName('')
    setDirectFormationId(''); setDirectSessionId('')
    setWkFirstName(''); setWkLastName(''); setWkEmail('')
    setWkPhone(''); setWkNationality(''); setWkDob('')
    setWkFormationId(''); setWkSessionId('')
    setError(''); setSuccess('')
  }

  const filteredStudents = studentSearch.trim()
    ? students.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
      )
    : students.slice(0, 8)

  const directSessions = sessions.filter(s => s.formationId === directFormationId)
  const wkSessions     = sessions.filter(s => s.formationId === wkFormationId)

  function handleDirect() {
    if (!directStudentId) { setError('Veuillez sélectionner un étudiant.'); return }
    if (!directFormationId) { setError('Veuillez sélectionner une formation.'); return }
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
    if (!wkFirstName || !wkLastName) { setError('Le prénom et le nom sont requis.'); return }
    if (!wkEmail) { setError('L\'email est requis.'); return }
    if (!wkPhone) { setError('Le téléphone est requis.'); return }
    if (!wkNationality || !wkDob) { setError('La nationalité et la date de naissance sont requises.'); return }
    if (!wkFormationId) { setError('Veuillez sélectionner une formation.'); return }
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

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Ajouter une inscription</DialogTitle>
        </DialogHeader>

        {/* ── Mode selection cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <ModeCard
            active={mode === 'direct'}
            onClick={() => { setMode('direct'); setError(''); setSuccess('') }}
            icon={<UserCheck className="h-5 w-5" />}
            iconBg="bg-blue-100 text-blue-600"
            title="Inscription directe"
            description="Étudiant déjà dans le système — inscription immédiate sans email ni validation"
          />
          <ModeCard
            active={mode === 'workflow'}
            onClick={() => { setMode('workflow'); setError(''); setSuccess('') }}
            icon={<Mail className="h-5 w-5" />}
            iconBg="bg-violet-100 text-violet-600"
            title="Lancer le workflow"
            description="Nouveau candidat — envoi automatique du formulaire d'évaluation par email"
          />
        </div>

        <Separator />

        {/* ── Direct mode ──────────────────────────────────────── */}
        {mode === 'direct' && (
          <div className="flex flex-col gap-5">
            {/* Student search */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Étudiant <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Rechercher par nom ou email…"
                  value={studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value)
                    setDropdownOpen(true)
                    setDirectStudentId('')
                    setDirectStudentName('')
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="pl-9"
                />
              </div>

              {dropdownOpen && (
                <div className="rounded-xl border bg-popover shadow-md divide-y overflow-hidden">
                  {filteredStudents.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-muted-foreground text-center">
                      Aucun étudiant trouvé.
                    </p>
                  ) : filteredStudents.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setDirectStudentId(s.id)
                        setDirectStudentName(s.name)
                        setStudentSearch(s.name)
                        setDropdownOpen(false)
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center justify-between',
                        directStudentId === s.id && 'bg-muted',
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                      {directStudentId === s.id && (
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {directStudentId && !dropdownOpen && (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {directStudentName} sélectionné
                </p>
              )}
            </div>

            {/* Formation */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Formation <span className="text-destructive">*</span>
              </Label>
              <Select
                value={directFormationId}
                onValueChange={v => { setDirectFormationId(v as string); setDirectSessionId('') }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une formation…" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Session */}
            {directSessions.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  Promotion
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optionnel)</span>
                </Label>
                <Select value={directSessionId} onValueChange={v => setDirectSessionId(v as string)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune promotion assignée" />
                  </SelectTrigger>
                  <SelectContent>
                    {directSessions.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {/* ── Workflow mode ─────────────────────────────────────── */}
        {mode === 'workflow' && (
          <div className="flex flex-col gap-6">
            {/* Identity */}
            <section className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Identité du candidat
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom" required>
                  <Input
                    value={wkFirstName}
                    onChange={e => setWkFirstName(e.target.value)}
                    placeholder="Mohamed"
                  />
                </Field>
                <Field label="Nom" required>
                  <Input
                    value={wkLastName}
                    onChange={e => setWkLastName(e.target.value)}
                    placeholder="Alami"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nationalité" required>
                  <Input
                    value={wkNationality}
                    onChange={e => setWkNationality(e.target.value)}
                    placeholder="Marocaine"
                  />
                </Field>
                <Field label="Date de naissance" required>
                  <Input
                    type="date"
                    value={wkDob}
                    onChange={e => setWkDob(e.target.value)}
                  />
                </Field>
              </div>
            </section>

            {/* Contact */}
            <section className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Contact
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={wkEmail}
                    onChange={e => setWkEmail(e.target.value)}
                    placeholder="candidat@email.com"
                  />
                </Field>
                <Field label="Téléphone" required>
                  <Input
                    type="tel"
                    value={wkPhone}
                    onChange={e => setWkPhone(e.target.value)}
                    placeholder="+212 6 00 00 00 00"
                  />
                </Field>
              </div>
            </section>

            {/* Formation */}
            <section className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Formation
              </p>
              <Field label="Formation" required>
                <Select
                  value={wkFormationId}
                  onValueChange={v => { setWkFormationId(v as string); setWkSessionId('') }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une formation…" />
                  </SelectTrigger>
                  <SelectContent>
                    {formations.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {wkSessions.length > 0 && (
                <Field label="Promotion" optional>
                  <Select value={wkSessionId} onValueChange={v => setWkSessionId(v as string)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune promotion assignée" />
                    </SelectTrigger>
                    <SelectContent>
                      {wkSessions.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </section>
          </div>
        )}

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-2">
          {(error || success) && <Feedback error={error} success={success} />}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setOpen(false); reset() }}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              className="flex-1"
              onClick={mode === 'direct' ? handleDirect : handleWorkflow}
              disabled={isPending}
            >
              {isPending
                ? 'En cours…'
                : mode === 'direct'
                  ? 'Inscrire directement'
                  : 'Envoyer le formulaire d\'évaluation'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function ModeCard({
  active, onClick, icon, iconBg, title, description,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all',
        active
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30',
      )}
    >
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  )
}

function Field({
  label, required, optional, children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        {optional && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optionnel)</span>}
      </Label>
      {children}
    </div>
  )
}

function Feedback({ error, success }: { error: string; success: string }) {
  if (error)
    return (
      <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {error}
      </div>
    )
  if (success)
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
        <CheckCircle className="h-4 w-4 shrink-0" />
        {success}
      </div>
    )
  return null
}
