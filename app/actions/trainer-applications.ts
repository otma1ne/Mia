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
  if (!application)                    return { error: 'Candidature introuvable.' }
  if (application.status !== 'PENDING') return { error: 'Cette candidature a déjà été traitée.' }

  const existingUser = await db.user.findUnique({ where: { email: application.email } })
  if (existingUser) return { error: 'Un compte existe déjà avec cet email.' }

  const skills = application.skills as ApplicationSkill[]

  const VALID: ExpertiseLevel[] = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT']
  const expertiseLevels = [...new Set(
    skills
      .map(s => s.level)
      .filter((l): l is ExpertiseLevel => VALID.includes(l as ExpertiseLevel))
  )]

  const tempPassword = generatePassword()
  const hashed       = await hashPassword(tempPassword)
  const name         = `${application.firstName} ${application.lastName}`.trim()

  await db.$transaction([
    db.user.create({
      data: {
        name,
        email:    application.email,
        phone:    application.phone,
        password: hashed,
        role:     'TRAINER',
        trainer: {
          create: {
            bio:             application.bio,
            specializations: skills.map(s => s.name),
            expertiseLevels,
            credentials:     [],
            cvUrl:           application.cvUrl,
            diplomeUrl:      application.diplomeUrls[0] ?? null,
          },
        },
      },
    }),
    db.trainerApplication.update({ where: { id }, data: { status: 'ACCEPTED' } }),
  ])

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
  if (application.status !== 'PENDING') return { error: 'Cette candidature a déjà été traitée.' }

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
  revalidatePath('/admin/trainers')
}
