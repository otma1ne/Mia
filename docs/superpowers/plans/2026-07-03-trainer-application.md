# Trainer Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let trainer candidates self-register on the public MIA site with CV/diplomas/skills, and let admins review, accept (auto-create account + send temp password), or decline candidatures in a dedicated CRM tab.

**Architecture:** New `TrainerApplication` + `Skill` Prisma models. Public form at `/rejoindre-notre-equipe`. Admin tab on `/admin/trainers`. Follows exact same patterns as existing `Inscription` (student application) flow. Pusher notification on new application. On accept: creates `User` + `Trainer`, sends welcome email via existing `sendTrainerWelcomeEmail`.

**Tech Stack:** Next.js 16.2 App Router, Prisma/MongoDB, Cloudinary (file uploads via `/api/upload-cv`), Pusher Channels, Nodemailer, Tailwind CSS v4, React 19 Server Actions, `useActionState`.

## Global Constraints

- Server Components by default; `'use client'` only when state/effects/events needed
- Use `@/` path aliases always — no relative imports
- No `any` types except where Prisma JSON fields require it (cast with `as`)
- MongoDB: use `npx prisma db push` (no migrations), stop dev server first on Windows
- Follow rooms-manager pattern for SkillsManager (useActionState + optimistic list)
- Follow inscription-detail-sheet pattern for TrainerApplicationDetailSheet
- File upload: POST to `/api/upload-cv` (already exists), returns `{ url: string }`
- Commit message: never mention Claude or Co-Authored-By Claude

---

## Task 1: Prisma Schema — Skill + TrainerApplication models

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Skill`, `TrainerApplication`, `TrainerApplicationStatus` enum, `TRAINER_APPLICATION_NEW` in `NotificationType` — used by all subsequent tasks

- [ ] **Step 1: Add `TRAINER_APPLICATION_NEW` to `NotificationType` enum**

In `prisma/schema.prisma`, find the `NotificationType` enum and add the new value:

```prisma
enum NotificationType {
  INSCRIPTION_NEW
  DOCUMENT_SIGNED
  PAYMENT_RECEIVED
  SESSION_CHANGED
  TRAINER_APPLICATION_NEW
}
```

- [ ] **Step 2: Add `TrainerApplicationStatus` enum**

After the `NotificationType` block, add:

```prisma
enum TrainerApplicationStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

- [ ] **Step 3: Add `Skill` model**

After the `TrainerApplicationStatus` enum:

```prisma
model Skill {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String   @unique
  createdAt DateTime @default(now())
}
```

- [ ] **Step 4: Add `TrainerApplication` model**

After the `Skill` model:

```prisma
model TrainerApplication {
  id          String                   @id @default(auto()) @map("_id") @db.ObjectId
  firstName   String
  lastName    String
  email       String
  phone       String
  city        String
  bio         String
  cvUrl       String
  diplomeUrls String[]
  skills      Json
  status      TrainerApplicationStatus @default(PENDING)
  adminNote   String?
  createdAt   DateTime                 @default(now())
  updatedAt   DateTime                 @updatedAt
}
```

`skills` JSON shape at runtime: `Array<{ skillId: string; name: string; level: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE' | 'EXPERT' }>`

- [ ] **Step 5: Push schema to MongoDB**

Stop the dev server first (Windows EPERM issue locks the Prisma engine file).

```bash
npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 6: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected output: `Generated Prisma Client ... to ./node_modules/@prisma/client`

- [ ] **Step 7: Verify**

Start dev server (`npm run dev`) and confirm no startup errors.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Skill and TrainerApplication models to schema"
```

---

## Task 2: Skills CRUD — Actions + SkillsManager component

**Files:**
- Create: `app/actions/skills.ts`
- Create: `app/(admin)/admin/center/_components/skills-manager.tsx`
- Modify: `app/(admin)/admin/center/[id]/page.tsx`

**Interfaces:**
- Consumes: `Skill` model from Task 1
- Produces:
  - `getSkills(): Promise<{ id: string; name: string; createdAt: Date }[]>` — used by Task 4 (public form)
  - `createSkill(prev, formData): Promise<{ error?: string; success?: boolean }>`
  - `deleteSkill(id: string): Promise<void>`

- [ ] **Step 1: Create `app/actions/skills.ts`**

```typescript
'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/unauthorized')
}

export async function getSkills() {
  return db.skill.findMany({ orderBy: { name: 'asc' } })
}

export async function createSkill(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Le nom est obligatoire.' }

  const existing = await db.skill.findUnique({ where: { name } })
  if (existing) return { error: 'Cette compétence existe déjà.' }

  await db.skill.create({ data: { name } })
  revalidatePath('/admin/center')
  return { success: true }
}

export async function deleteSkill(id: string): Promise<void> {
  await requireAdmin()
  await db.skill.delete({ where: { id } })
  revalidatePath('/admin/center')
}
```

- [ ] **Step 2: Create `app/(admin)/admin/center/_components/skills-manager.tsx`**

Follow rooms-manager.tsx pattern exactly (useActionState, optimistic list, dialog for add, dialog for delete confirmation):

```typescript
'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createSkill, deleteSkill } from '@/app/actions/skills'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { BrainCircuit, CirclePlus, Trash2 } from 'lucide-react'

interface Skill {
  id: string
  name: string
}

interface SkillsManagerProps {
  initialSkills: Skill[]
}

export default function SkillsManager({ initialSkills }: SkillsManagerProps) {
  const [skills, setSkills]               = useState<Skill[]>(initialSkills)
  const [addOpen, setAddOpen]             = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState<Skill | null>(null)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [state, action, pending]          = useActionState(createSkill, null)
  const formRef                           = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setAddOpen(false)
      formRef.current?.reset()
    }
  }, [state])

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteSkill(deleteTarget.id)
    setSkills(prev => prev.filter(s => s.id !== deleteTarget.id))
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <Card className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Compétences intervenants</h2>
              <p className="text-xs text-muted-foreground">Liste des compétences proposées dans le formulaire candidature</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <CirclePlus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {skills.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 flex flex-col items-center gap-2 text-center">
            <BrainCircuit className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune compétence ajoutée.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm group"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(skill)}
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  aria-label={`Supprimer ${skill.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter une compétence</DialogTitle>
            <DialogDescription>Cette compétence sera proposée dans le formulaire de candidature intervenant.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skillName">Nom de la compétence</Label>
              <Input id="skillName" name="name" placeholder="Ex: Python, React, Excel…" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Ajout…' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la compétence</DialogTitle>
            <DialogDescription>
              Supprimer <strong>{deleteTarget?.name}</strong> ? Les candidatures existantes conserveront cette compétence dans leurs données.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 3: Add `SkillsManager` to center detail page**

In `app/(admin)/admin/center/[id]/page.tsx`:

Add import:
```typescript
import SkillsManager from '../_components/skills-manager'
import { getSkills } from '@/app/actions/skills'
```

In `getCenterById` call, also fetch skills:
```typescript
const [center, skills] = await Promise.all([
  getCenterById(id),
  getSkills(),
])
```

Add `<SkillsManager>` after `<CenterAccessPlansForm>`:
```tsx
{/* Compétences intervenants */}
<SkillsManager initialSkills={skills} />
```

- [ ] **Step 4: Verify**

Start dev server, go to `/admin/center` → click on the center → scroll to bottom. Should see "Compétences intervenants" card with "Ajouter" button. Add a skill, verify it appears. Delete it, verify it disappears.

- [ ] **Step 5: Commit**

```bash
git add app/actions/skills.ts app/(admin)/admin/center/_components/skills-manager.tsx app/(admin)/admin/center/\[id\]/page.tsx
git commit -m "feat: add skills management in center settings"
```

---

## Task 3: TrainerApplication Server Actions + Pusher type update

**Files:**
- Create: `app/actions/trainer-applications.ts`
- Modify: `lib/pusher.ts`

**Interfaces:**
- Consumes:
  - `db.trainerApplication` from Task 1
  - `publishNotification` from `lib/pusher.ts`
  - `hashPassword` from `@/lib/auth`
  - `generatePassword` from `@/lib/generate-password`
  - `sendTrainerWelcomeEmail` from `@/lib/email`
- Produces:
  - `ApplicationSkill` type
  - `TrainerApplicationRow` type
  - `createTrainerApplication(prev, formData)` — public Server Action
  - `getTrainerApplications(status?)` — admin only
  - `getPendingApplicationsCount()` — admin only
  - `acceptTrainerApplication(id)` — admin only
  - `declineTrainerApplication(id, note?)` — admin only
  - `updateTrainerApplicationNote(id, note)` — admin only

- [ ] **Step 1: Update `lib/pusher.ts` — add `TRAINER_APPLICATION_NEW` to the union type**

Find the `NotificationType` export and add the new value:

```typescript
export type NotificationType =
  | 'INSCRIPTION_NEW'
  | 'DOCUMENT_SIGNED'
  | 'PAYMENT_RECEIVED'
  | 'SESSION_CHANGED'
  | 'TRAINER_APPLICATION_NEW'
```

- [ ] **Step 2: Create `app/actions/trainer-applications.ts`**

```typescript
'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { publishNotification } from '@/lib/pusher'
import { hashPassword } from '@/lib/auth'
import { generatePassword } from '@/lib/generate-password'
import { sendTrainerWelcomeEmail } from '@/lib/email'
import type { ExpertiseLevel } from '@prisma/client'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/unauthorized')
}

// ─── Shared type for skills embedded in JSON ─────────────────────────────────

export type ApplicationSkill = {
  skillId: string
  name:    string
  level:   'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE' | 'EXPERT'
}

export type TrainerApplicationRow = {
  id:          string
  firstName:   string
  lastName:    string
  email:       string
  phone:       string
  city:        string
  bio:         string
  cvUrl:       string
  diplomeUrls: string[]
  skills:      ApplicationSkill[]
  status:      'PENDING' | 'ACCEPTED' | 'DECLINED'
  adminNote:   string | null
  createdAt:   Date
  updatedAt:   Date
}

// ─── Public — no auth required ────────────────────────────────────────────────

export async function createTrainerApplication(
  _prev: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const firstName       = (formData.get('firstName')    as string)?.trim()
  const lastName        = (formData.get('lastName')     as string)?.trim()
  const email           = (formData.get('email')        as string)?.trim().toLowerCase()
  const phone           = (formData.get('phone')        as string)?.trim()
  const city            = (formData.get('city')         as string)?.trim()
  const bio             = (formData.get('bio')          as string)?.trim()
  const cvUrl           = (formData.get('cvUrl')        as string)?.trim()
  const skillsJson      = (formData.get('skills')       as string) ?? '[]'
  const diplomeUrlsJson = (formData.get('diplomeUrls')  as string) ?? '[]'

  if (!firstName || !lastName || !email || !phone || !city || !bio || !cvUrl) {
    return { error: 'Tous les champs obligatoires doivent être renseignés.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { error: 'Adresse e-mail invalide.' }

  let skills: ApplicationSkill[] = []
  try { skills = JSON.parse(skillsJson) } catch { return { error: 'Données de compétences invalides.' } }
  if (skills.length === 0) return { error: 'Veuillez sélectionner au moins une compétence.' }

  let diplomeUrls: string[] = []
  try { diplomeUrls = JSON.parse(diplomeUrlsJson) } catch { diplomeUrls = [] }

  const existing = await db.trainerApplication.findFirst({
    where: { email, status: 'PENDING' },
  })
  if (existing) return { error: 'Une candidature est déjà en cours avec cet email.' }

  await db.trainerApplication.create({
    data: { firstName, lastName, email, phone, city, bio, cvUrl, diplomeUrls, skills },
  })

  publishNotification({
    type:  'TRAINER_APPLICATION_NEW',
    title: 'Nouvelle candidature intervenant',
    body:  'a soumis une candidature comme formateur',
    href:  '/admin/trainers?tab=candidatures',
    data:  { firstName, lastName },
  }).catch(() => {})

  return { success: true }
}

// ─── Admin — read ─────────────────────────────────────────────────────────────

export async function getTrainerApplications(
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED'
): Promise<TrainerApplicationRow[]> {
  await requireAdmin()
  const rows = await db.trainerApplication.findMany({
    where:   status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  })
  return rows.map(r => ({
    ...r,
    skills: r.skills as ApplicationSkill[],
    status: r.status as 'PENDING' | 'ACCEPTED' | 'DECLINED',
  }))
}

export async function getPendingApplicationsCount(): Promise<number> {
  await requireAdmin()
  return db.trainerApplication.count({ where: { status: 'PENDING' } })
}

// ─── Admin — accept ───────────────────────────────────────────────────────────

export async function acceptTrainerApplication(id: string): Promise<{ error?: string }> {
  await requireAdmin()

  const application = await db.trainerApplication.findUnique({ where: { id } })
  if (!application)                   return { error: 'Candidature introuvable.' }
  if (application.status !== 'PENDING') return { error: 'Cette candidature a déjà été traitée.' }

  const existingUser = await db.user.findUnique({ where: { email: application.email } })
  if (existingUser) return { error: 'Un compte existe déjà avec cet email.' }

  const skills = application.skills as ApplicationSkill[]

  const VALID: ExpertiseLevel[] = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT']
  const expertiseLevels = skills
    .map(s => s.level)
    .filter((l): l is ExpertiseLevel => VALID.includes(l as ExpertiseLevel))

  const tempPassword = generatePassword()
  const hashed       = await hashPassword(tempPassword)
  const name         = `${application.firstName} ${application.lastName}`.trim()

  await db.user.create({
    data: {
      name,
      email:    application.email,
      phone:    application.phone,
      password: hashed,
      role:     'TRAINER',
      trainer: {
        create: {
          bio:              application.bio,
          specializations:  skills.map(s => s.name),
          expertiseLevels,
          credentials:      [],
          cvUrl:            application.cvUrl,
          diplomeUrl:       application.diplomeUrls[0] ?? null,
        },
      },
    },
  })

  await db.trainerApplication.update({ where: { id }, data: { status: 'ACCEPTED' } })
  revalidatePath('/admin/trainers')

  try {
    await sendTrainerWelcomeEmail(application.email, name, tempPassword)
  } catch (err) {
    console.error('[acceptTrainerApplication] Failed to send welcome email:', err)
  }

  return {}
}

// ─── Admin — decline ──────────────────────────────────────────────────────────

export async function declineTrainerApplication(
  id: string,
  note?: string
): Promise<{ error?: string }> {
  await requireAdmin()

  const application = await db.trainerApplication.findUnique({ where: { id } })
  if (!application) return { error: 'Candidature introuvable.' }

  await db.trainerApplication.update({
    where: { id },
    data:  { status: 'DECLINED', adminNote: note ?? null },
  })

  revalidatePath('/admin/trainers')
  return {}
}

// ─── Admin — update note ──────────────────────────────────────────────────────

export async function updateTrainerApplicationNote(id: string, note: string): Promise<void> {
  await requireAdmin()
  await db.trainerApplication.update({ where: { id }, data: { adminNote: note } })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: 0 errors related to the new files (Prisma client must be regenerated from Task 1 first).

- [ ] **Step 4: Commit**

```bash
git add app/actions/trainer-applications.ts lib/pusher.ts
git commit -m "feat: add trainer application server actions"
```

---

## Task 4: Public Registration Form

**Files:**
- Create: `app/rejoindre-notre-equipe/page.tsx`
- Create: `app/rejoindre-notre-equipe/merci/page.tsx`
- Create: `app/rejoindre-notre-equipe/_components/trainer-application-form.tsx`
- Create: `app/rejoindre-notre-equipe/_components/skill-selector.tsx`

**Interfaces:**
- Consumes:
  - `getSkills()` from Task 2
  - `createTrainerApplication(prev, formData)` from Task 3
  - `/api/upload-cv` POST endpoint (already exists)
- Produces: public pages at `/rejoindre-notre-equipe` and `/rejoindre-notre-equipe/merci`

- [ ] **Step 1: Create `app/rejoindre-notre-equipe/_components/skill-selector.tsx`**

Client component — renders a checkbox per skill; when checked, shows a level select:

```typescript
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ApplicationSkill } from '@/app/actions/trainer-applications'

const LEVELS: { value: ApplicationSkill['level']; label: string }[] = [
  { value: 'DEBUTANT',      label: 'Débutant'      },
  { value: 'INTERMEDIAIRE', label: 'Intermédiaire' },
  { value: 'AVANCE',        label: 'Avancé'        },
  { value: 'EXPERT',        label: 'Expert'        },
]

interface SkillSelectorProps {
  skills: { id: string; name: string }[]
  onChange: (skills: ApplicationSkill[]) => void
}

export default function SkillSelector({ skills, onChange }: SkillSelectorProps) {
  const [selected, setSelected] = useState<Record<string, ApplicationSkill['level'] | null>>({})

  function toggleSkill(skill: { id: string; name: string }) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[skill.id] !== undefined) {
        delete next[skill.id]
      } else {
        next[skill.id] = 'INTERMEDIAIRE'
      }
      const result: ApplicationSkill[] = skills
        .filter(s => next[s.id] !== undefined)
        .map(s => ({ skillId: s.id, name: s.name, level: next[s.id]! }))
      onChange(result)
      return next
    })
  }

  function setLevel(skillId: string, level: ApplicationSkill['level']) {
    setSelected(prev => {
      const next = { ...prev, [skillId]: level }
      const result: ApplicationSkill[] = skills
        .filter(s => next[s.id] !== undefined)
        .map(s => ({ skillId: s.id, name: s.name, level: next[s.id]! }))
      onChange(result)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {skills.map(skill => {
        const isSelected = selected[skill.id] !== undefined
        const level      = selected[skill.id]

        return (
          <div key={skill.id} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleSkill(skill)}
              className={[
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-border bg-background text-foreground hover:border-violet-300',
              ].join(' ')}
            >
              <span className={[
                'h-2 w-2 rounded-full',
                isSelected ? 'bg-violet-600' : 'bg-muted-foreground/30',
              ].join(' ')} />
              {skill.name}
            </button>

            {isSelected && (
              <Select
                value={level ?? 'INTERMEDIAIRE'}
                onValueChange={v => setLevel(skill.id, v as ApplicationSkill['level'])}
              >
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map(l => (
                    <SelectItem key={l.value} value={l.value} className="text-xs">
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create `app/rejoindre-notre-equipe/_components/trainer-application-form.tsx`**

```typescript
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
import SkillSelector from './skill-selector'

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

      {/* ① Informations personnelles */}
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

      {/* ② Documents */}
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

      {/* ③ Compétences */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold border-b pb-2">③ Compétences <span className="text-destructive">*</span></h2>
        <p className="text-sm text-muted-foreground">Sélectionnez vos compétences et indiquez votre niveau pour chacune.</p>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune compétence disponible pour le moment.</p>
        ) : (
          <SkillSelector skills={skills} onChange={setSelectedSkills} />
        )}
      </section>

      {/* ④ Présentation */}
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
```

- [ ] **Step 3: Create `app/rejoindre-notre-equipe/page.tsx`**

```typescript
import type { Metadata } from 'next'
import { getSkills } from '@/app/actions/skills'
import TrainerApplicationForm from './_components/trainer-application-form'

export const metadata: Metadata = {
  title: 'Rejoindre notre équipe — MIA Académie',
  description: 'Candidatez pour devenir formateur chez MIA Académie. Partagez votre expertise avec nos apprenants.',
}

export default async function RejoindreNotreEquipePage() {
  const skills = await getSkills()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <p className="text-sm font-semibold text-violet-600 mb-3">Rejoindre l'équipe</p>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Devenez formateur chez MIA</h1>
          <p className="text-muted-foreground leading-relaxed">
            Vous avez une expertise à partager ? Rejoignez notre réseau de formateurs et
            contribuez à la montée en compétences de nos apprenants.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl px-4 py-12">
        <TrainerApplicationForm skills={skills} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/rejoindre-notre-equipe/merci/page.tsx`**

```typescript
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Candidature reçue — MIA Académie' }

export default function MerciPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-6 max-w-sm">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Candidature reçue !</h1>
          <p className="text-muted-foreground">
            Notre équipe examinera votre dossier et vous contactera sous 48h.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify**

Start dev server, visit `http://localhost:3000/rejoindre-notre-equipe`. Should see the 4-section form. Test:
- Fill all fields, upload a CV PDF, select 2 skills with levels, write bio
- Submit → confirm form disappears, success message appears
- Check `/admin/trainers?tab=candidatures` shows the new application (after Task 6)

- [ ] **Step 6: Commit**

```bash
git add app/rejoindre-notre-equipe/
git commit -m "feat: add public trainer application form at /rejoindre-notre-equipe"
```

---

## Task 5: Landing Page — "Vous êtes formateur ?" section

**Files:**
- Modify: `components/landing/landing-page.tsx`

**Interfaces:**
- Consumes: nothing from other tasks — standalone UI change
- Produces: new section visible at the bottom of the landing page

- [ ] **Step 1: Add the section in `components/landing/landing-page.tsx`**

Find the contact section opening tag (line ~768):
```tsx
<section id="contact" className="relative py-28" style={{ background: 'var(--surface-muted)' }}>
```

Insert the following **before** that line:

```tsx
{/* ── Vous êtes formateur ? ───────────────────────────────────── */}
<section className="relative py-20" style={{ background: 'var(--surface-default)' }}>
  <div className="mx-auto max-w-7xl px-6 lg:px-12">
    <div className="reveal-up rounded-[24px] px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8"
         style={{ background: 'var(--surface-accent)', border: '1px solid var(--mia-purple-soft)' }}>
      <div className="flex flex-col gap-4 max-w-lg">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: 'var(--mia-purple)', color: '#fff' }}>
            Intervenants
          </span>
        </div>
        <h2 className="font-heading leading-tight tracking-tight"
            style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', color: 'var(--text-strong)', fontWeight: 600 }}>
          Vous êtes formateur ?
        </h2>
        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Rejoignez notre réseau d&apos;intervenants et partagez votre expertise avec nos apprenants.
          Déposez votre candidature en quelques minutes.
        </p>
        <ul className="flex flex-col gap-2">
          {[
            'Formations certifiées et reconnues',
            'Flexibilité : présentiel ou distanciel',
            'Accompagnement pédagogique dédié',
          ].map(item => (
            <li key={item} className="flex items-center gap-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--mia-purple)' }} />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="shrink-0">
        <Link href="/rejoindre-notre-equipe"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[32px] text-white text-[15px] font-semibold transition-all hover:-translate-y-px"
              style={{ background: 'var(--mia-purple)' }}>
          Candidater maintenant
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  </div>
</section>
```

`CheckCircle2` is already imported in the landing page (`import { ArrowRight, ..., CheckCircle2, ... }`). Verify before adding — if not present, add it to the existing lucide-react import.

- [ ] **Step 2: Verify**

Open `http://localhost:3000`. Scroll to just before the contact section. Should see the purple-tinted "Vous êtes formateur ?" card with the "Candidater maintenant" button. Click the button — should navigate to `/rejoindre-notre-equipe`.

- [ ] **Step 3: Commit**

```bash
git add components/landing/landing-page.tsx
git commit -m "feat: add trainer recruitment section to landing page"
```

---

## Task 6: Admin Candidatures Tab

**Files:**
- Create: `app/(admin)/admin/trainers/_components/trainer-applications-tab.tsx`
- Create: `app/(admin)/admin/trainers/_components/trainer-application-detail-sheet.tsx`
- Modify: `app/(admin)/admin/trainers/page.tsx`
- Modify: `app/(admin)/admin/trainers/_components/trainers-client.tsx`

**Interfaces:**
- Consumes:
  - `TrainerApplicationRow`, `ApplicationSkill`, `getTrainerApplications`, `getPendingApplicationsCount`, `acceptTrainerApplication`, `declineTrainerApplication`, `updateTrainerApplicationNote` from Task 3
- Produces: admin UI at `/admin/trainers` with two tabs

- [ ] **Step 1: Create `app/(admin)/admin/trainers/_components/trainer-application-detail-sheet.tsx`**

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  acceptTrainerApplication,
  declineTrainerApplication,
  updateTrainerApplicationNote,
} from '@/app/actions/trainer-applications'
import type { TrainerApplicationRow } from '@/app/actions/trainer-applications'
import { ExternalLink, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const LEVEL_LABELS: Record<string, string> = {
  DEBUTANT:      'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE:        'Avancé',
  EXPERT:        'Expert',
}

const STATUS_MAP = {
  PENDING:  { label: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Acceptée',   className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED: { label: 'Refusée',    className: 'bg-red-100 text-red-700 border-red-200' },
}

interface Props {
  application: TrainerApplicationRow
  open:        boolean
  onOpenChange:(open: boolean) => void
}

export default function TrainerApplicationDetailSheet({ application, open, onOpenChange }: Props) {
  const [showDecline, setShowDecline]     = useState(false)
  const [note, setNote]                   = useState(application.adminNote ?? '')
  const [error, setError]                 = useState('')
  const [isAccepting, startAccept]        = useTransition()
  const [isDeclining, startDecline]       = useTransition()

  const { label, className } = STATUS_MAP[application.status]
  const fullName = `${application.firstName} ${application.lastName}`

  function handleAccept() {
    setError('')
    startAccept(async () => {
      const result = await acceptTrainerApplication(application.id)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleDecline() {
    if (!showDecline) { setShowDecline(true); return }
    setError('')
    startDecline(async () => {
      const result = await declineTrainerApplication(application.id, note.trim() || undefined)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleNoteBlur() {
    updateTrainerApplicationNote(application.id, note).catch(() => {})
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
              {application.firstName[0]}{application.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base">{fullName}</SheetTitle>
              <SheetDescription className="text-xs">{application.email}</SheetDescription>
            </div>
            <Badge variant="outline" className={className}>{label}</Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6 px-6 py-6">
          {/* Infos */}
          <section className="flex flex-col gap-2 text-sm">
            <p><span className="text-muted-foreground w-20 inline-block">Téléphone</span>{application.phone}</p>
            <p><span className="text-muted-foreground w-20 inline-block">Ville</span>{application.city}</p>
            <p><span className="text-muted-foreground w-20 inline-block">Date</span>{format(application.createdAt, 'd MMM yyyy', { locale: fr })}</p>
          </section>

          <Separator />

          {/* Bio */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Présentation</p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{application.bio}</p>
          </section>

          <Separator />

          {/* Skills */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Compétences</p>
            <div className="flex flex-wrap gap-2">
              {application.skills.map(s => (
                <Badge key={s.skillId} variant="outline" className="text-xs">
                  {s.name} · {LEVEL_LABELS[s.level] ?? s.level}
                </Badge>
              ))}
            </div>
          </section>

          <Separator />

          {/* Documents */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents</p>
            <div className="flex flex-col gap-2">
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 hover:underline"
              >
                <FileText className="h-4 w-4" />
                CV
                <ExternalLink className="h-3 w-3" />
              </a>
              {application.diplomeUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Diplôme {i + 1}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </section>

          <Separator />

          {/* Admin note */}
          <section>
            <Label htmlFor="adminNote" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
              Note interne
            </Label>
            <Textarea
              id="adminNote"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Notes visibles uniquement par les admins…"
              rows={3}
              className="resize-none text-sm"
            />
          </section>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          {application.status === 'PENDING' && (
            <div className="flex flex-col gap-3">
              {showDecline ? (
                <>
                  <p className="text-sm text-muted-foreground">La note interne sera enregistrée avec le refus.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowDecline(false)}>
                      Annuler
                    </Button>
                    <Button variant="destructive" className="flex-1" disabled={isDeclining} onClick={handleDecline}>
                      {isDeclining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer le refus'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleDecline}>
                    Refuser
                  </Button>
                  <Button className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={isAccepting} onClick={handleAccept}>
                    {isAccepting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…</>
                      : <><CheckCircle className="mr-2 h-4 w-4" /> Accepter</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Create `app/(admin)/admin/trainers/_components/trainer-applications-tab.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { TrainerApplicationRow } from '@/app/actions/trainer-applications'
import TrainerApplicationDetailSheet from './trainer-application-detail-sheet'

const STATUS_TABS: { label: string; value: 'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED' }[] = [
  { label: 'Toutes',     value: 'ALL' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Acceptées',  value: 'ACCEPTED' },
  { label: 'Refusées',   value: 'DECLINED' },
]

const STATUS_MAP = {
  PENDING:  { label: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Acceptée',   className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED: { label: 'Refusée',    className: 'bg-red-100 text-red-700 border-red-200' },
}

const LEVEL_SHORT: Record<string, string> = {
  DEBUTANT: 'Deb', INTERMEDIAIRE: 'Int', AVANCE: 'Avancé', EXPERT: 'Expert',
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

interface TrainerApplicationsTabProps {
  applications: TrainerApplicationRow[]
}

export default function TrainerApplicationsTab({ applications }: TrainerApplicationsTabProps) {
  const [activeTab, setActiveTab]     = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED'>('ALL')
  const [selected, setSelected]       = useState<TrainerApplicationRow | null>(null)
  const [sheetOpen, setSheetOpen]     = useState(false)

  const filtered = activeTab === 'ALL'
    ? applications
    : applications.filter(a => a.status === activeTab)

  function openSheet(application: TrainerApplicationRow) {
    setSelected(application)
    setSheetOpen(true)
  }

  return (
    <>
      {/* Status tabs */}
      <div className="flex gap-0.5 flex-wrap">
        {STATUS_TABS.map(tab => {
          const count    = tab.value === 'ALL' ? applications.length : applications.filter(a => a.status === tab.value).length
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {tab.label} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Aucune candidature</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Compétences</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(application => {
                const { label, className } = STATUS_MAP[application.status]
                return (
                  <TableRow
                    key={application.id}
                    className="cursor-pointer"
                    onClick={() => openSheet(application)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                          {getInitials(application.firstName, application.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{application.firstName} {application.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{application.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{application.city}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {application.skills.slice(0, 3).map(s => (
                          <Badge key={s.skillId} variant="outline" className="text-[10px] px-1.5 py-0">
                            {s.name}
                          </Badge>
                        ))}
                        {application.skills.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                            +{application.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(application.createdAt, 'd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={className}>{label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {selected && (
        <TrainerApplicationDetailSheet
          application={selected}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Update `app/(admin)/admin/trainers/page.tsx`**

Replace the file content:

```typescript
import type { Metadata } from 'next'
import { getTrainers, getTrainerFormCategories } from '@/app/actions/trainers'
import { getTrainerApplications, getPendingApplicationsCount } from '@/app/actions/trainer-applications'
import TrainersClient from './_components/trainers-client'
import TrainerApplicationsTab from './_components/trainer-applications-tab'

export const metadata: Metadata = { title: 'Formateurs — MIA Académie' }

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>
}

export default async function TrainersPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '', tab = 'formateurs' } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [data, categories, applications, pendingCount] = await Promise.all([
    getTrainers({ page, search }),
    getTrainerFormCategories(),
    getTrainerApplications(),
    getPendingApplicationsCount(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b pb-0">
        {[
          { value: 'formateurs',   label: 'Formateurs' },
          { value: 'candidatures', label: 'Candidatures', badge: pendingCount },
        ].map(t => (
          <a
            key={t.value}
            href={`?tab=${t.value}`}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                {t.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {tab === 'candidatures' ? (
        <TrainerApplicationsTab applications={applications} />
      ) : (
        <TrainersClient data={data} search={search} categories={categories} />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify end-to-end**

1. Go to `/rejoindre-notre-equipe`, submit a complete application (fill all fields, upload CV, select skills, write bio)
2. Immediately go to `/admin/trainers?tab=candidatures` — should see the new application in the table
3. Click on the row — detail sheet opens with all info (bio, skills, CV link)
4. Click "Accepter" — loading state, then sheet closes, application moves to "Acceptées"
5. Go to `/admin/trainers` (formateurs tab) — the new trainer account should appear
6. Check email inbox — should have received the welcome email with temp password

- [ ] **Step 5: Commit**

```bash
git add app/(admin)/admin/trainers/
git commit -m "feat: add trainer candidatures tab to admin trainers page"
```
