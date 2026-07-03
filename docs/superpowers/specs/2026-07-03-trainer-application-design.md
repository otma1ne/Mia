# Trainer Application — Design Spec

## Goal

Allow trainer candidates to self-register on the MIA public site, upload their CV and diplomas, and declare their skills with proficiency levels. Admin reviews candidatures in a dedicated tab and can accept (auto-creates trainer account) or decline.

## Architecture

Two-sided feature: public registration form + admin CRM tab, following the same pattern as student `Inscription`. A new `TrainerApplication` model holds candidatures independently of the existing `Trainer`/`User` models until acceptance.

## Tech Stack

Next.js 16.2 App Router, Prisma/MongoDB, Cloudinary (file uploads), Pusher Channels (admin notification), Resend (transactional email), Tailwind CSS v4, React 19 Server Actions.

## Global Constraints

- Follow existing code patterns: Server Components by default, `'use client'` only when needed
- Use `@/` path aliases throughout
- No `any` types in TypeScript
- File uploads via Cloudinary (same pattern as CV upload in student inscription)
- Pusher notification on new application (same pattern as `INSCRIPTION_NEW`)
- MongoDB — use `db push` to apply schema changes (no migrations)

---

## 1. Data Model

### New enum

```prisma
enum TrainerApplicationStatus {
  PENDING
  ACCEPTED
  DECLINED
}
```

### New model: `Skill`

```prisma
model Skill {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  name      String   @unique
  createdAt DateTime @default(now())
}
```

Managed by admin in `/admin/center` settings. Independent model (not tied to Center) for cleanliness.

### New model: `TrainerApplication`

```prisma
model TrainerApplication {
  id          String                    @id @default(auto()) @map("_id") @db.ObjectId
  firstName   String
  lastName    String
  email       String
  phone       String
  city        String
  bio         String
  cvUrl       String                    // Cloudinary URL — required
  diplomeUrls String[]                  // Cloudinary URLs — optional, multiple
  skills      Json                      // [{skillId, name, level: ExpertiseLevel}]
  status      TrainerApplicationStatus  @default(PENDING)
  adminNote   String?
  createdAt   DateTime                  @default(now())
  updatedAt   DateTime                  @updatedAt
}
```

`skills` JSON shape: `Array<{ skillId: string; name: string; level: 'DEBUTANT' | 'INTERMEDIAIRE' | 'AVANCE' | 'EXPERT' }>`

### Modification: `NotificationType` enum

Add `TRAINER_APPLICATION_NEW` to existing enum.

### No changes to `Center`, `Trainer`, or `User` models

---

## 2. Public Flow

### Landing page — new section

New section on `components/landing/landing-page.tsx`, placed before the footer. Contains:
- Heading: "Vous êtes formateur ?"
- 3–4 bullet points (rejoignez l'équipe, partagez votre expertise, formations certifiées...)
- CTA button (violet) → `/rejoindre-notre-equipe`

### Page `/rejoindre-notre-equipe`

**Route:** `app/rejoindre-notre-equipe/page.tsx` (public, no auth required)

Form in a single page (no wizard), 4 sections:

**① Informations personnelles**
- Prénom (required)
- Nom (required)
- Email (required)
- Téléphone (required)
- Ville (required)

**② Documents**
- CV PDF — Cloudinary upload, required, single file
- Diplômes — Cloudinary upload, optional, multiple files (up to 5)

**③ Compétences**
- List of predefined `Skill` records fetched from DB
- Each skill: checkbox to select + if checked, dropdown to pick level (Débutant / Intermédiaire / Avancé / Expert)
- Minimum 1 skill required

**④ Présentation**
- `bio` textarea — "Présentez-vous en quelques lignes" (required, min 50 chars)

**Submission:**
- Server Action `createTrainerApplication`
- Validates all required fields
- Persists `TrainerApplication` with status `PENDING`
- Fires `publishNotification({ type: 'TRAINER_APPLICATION_NEW', ... })` (fire-and-forget)
- Redirects to `/rejoindre-notre-equipe/merci`

**Page `/rejoindre-notre-equipe/merci`**
- Static confirmation page: "Votre candidature a bien été reçue. Nous vous contacterons sous 48h."

---

## 3. Admin Flow

### Page `/admin/trainers` — 2 tabs

Add tab navigation to the existing trainers page:

- **Tab "Formateurs"** — existing content (active trainers table)
- **Tab "Candidatures"** — new, with unread count badge

### Tab "Candidatures"

Table columns: Nom, Email, Ville, Compétences (badges, max 3 shown), Date, Statut, Actions menu.

Filters: Toutes / En attente / Acceptées / Refusées (query param `?status=`)

Click on row → `TrainerApplicationDetailSheet`

### `TrainerApplicationDetailSheet`

Right-side sheet panel with:

1. **Header** — avatar (initials), full name, status badge
2. **Infos** — Email, Téléphone, Ville, Bio
3. **Compétences** — grid of `[Skill · Niveau]` badges
4. **Documents** — download links for CV + each diplôme
5. **Note admin** — textarea (saved on blur via server action)
6. **Actions** — "Accepter" (primary) / "Refuser" (destructive)

### Action: Accept (`acceptTrainerApplication`)

Server Action (admin only):

1. Generate temporary password: `MIA-` + 4 random uppercase chars + 2 digits (e.g. `MIA-RXKP42`)
2. Hash password with bcrypt
3. Create `User` (`role: TRAINER`, `name: firstName + ' ' + lastName`, `email`, `phone`, hashed password)
4. Create `Trainer` (`userId`, `bio`, `specializations` from skill names, `expertiseLevels` from skill levels, `cvUrl`, `diplomeUrl` = first diplome if any)
5. Send email to candidate: subject "Bienvenue chez MIA Académie", body includes login URL, email, temporary password
6. Update `TrainerApplication` → `ACCEPTED`
7. `revalidatePath('/admin/trainers')`

### Action: Decline (`declineTrainerApplication`)

Server Action (admin only):

1. Update `TrainerApplication` → `DECLINED`, save `adminNote`
2. `revalidatePath('/admin/trainers')`

No decline email for now (no requirement stated).

---

## 4. Skills Management (Center Settings)

### Page `/admin/center` — new section "Compétences intervenants"

New component `SkillsManager` added to the center settings page, following the same pattern as `rooms-manager.tsx`.

**UI:**
- List of existing skills with name + delete button (`×`)
- Input + "Ajouter" button to create new skill
- On delete: confirmation if skill is referenced in any `TrainerApplication` (warn, still allow)
- Changes saved immediately (no Save button needed — optimistic updates)

**Server Actions** (in `app/actions/skills.ts`):
- `getSkills()` — returns all skills ordered by name
- `createSkill(name)` — admin only, creates `Skill`
- `deleteSkill(id)` — admin only, deletes `Skill`

---

## 5. Notifications

Add `TRAINER_APPLICATION_NEW` to `NotificationType` enum in both `prisma/schema.prisma` and `lib/pusher.ts`.

`publishNotification` call in `createTrainerApplication`:

```ts
publishNotification({
  type: 'TRAINER_APPLICATION_NEW',
  title: 'Nouvelle candidature intervenant',
  body: 'a soumis une candidature comme formateur',
  href: '/admin/trainers?tab=candidatures',
  data: { firstName, lastName },
}).catch(() => {})
```

The `NotificationBell` already handles unknown types gracefully (shows name + body text without formation card).

---

## 6. File Structure

**New files:**
```
app/rejoindre-notre-equipe/
  page.tsx                          — public form page (Server Component shell)
  merci/page.tsx                    — confirmation page
  _components/
    trainer-application-form.tsx    — 'use client' form
    skill-selector.tsx              — checkbox + level picker per skill

app/actions/
  trainer-applications.ts           — createTrainerApplication, acceptTrainerApplication,
                                      declineTrainerApplication, getTrainerApplications,
                                      updateTrainerApplicationNote
  skills.ts                         — getSkills, createSkill, deleteSkill

app/(admin)/admin/trainers/
  _components/
    trainer-applications-tab.tsx    — applications table + filters
    trainer-application-detail-sheet.tsx — detail panel

app/(admin)/admin/center/_components/
  skills-manager.tsx                — inline add/delete skills list
```

**Modified files:**
```
prisma/schema.prisma                — add Skill, TrainerApplication, TrainerApplicationStatus,
                                      TRAINER_APPLICATION_NEW to NotificationType
lib/pusher.ts                       — add TRAINER_APPLICATION_NEW to NotificationType union
components/landing/landing-page.tsx — add "Vous êtes formateur ?" section
app/(admin)/admin/trainers/page.tsx — add tab navigation
app/(admin)/admin/trainers/_components/trainers-client.tsx — move to tab
app/(admin)/admin/center/[id]/page.tsx — add SkillsManager section
components/notifications/notification-bell.tsx — handle TRAINER_APPLICATION_NEW display
```
