'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { sendEvaluationEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

// ─────────────────────────────────────────────────────────────────
// Form data for the dialog (students + formations + sessions)
// ─────────────────────────────────────────────────────────────────

export async function getAdminInscriptionFormData() {
  const [students, formations, sessions] = await Promise.all([
    db.user.findMany({
      where:   { role: 'STUDENT' },
      select:  { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    db.formation.findMany({
      where:   { status: { not: 'ARCHIVED' } },
      select:  { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
    db.trainingSession.findMany({
      where:   { status: { not: 'CANCELLED' } },
      select:  { id: true, title: true, formationId: true },
      orderBy: { startDate: 'asc' },
    }),
  ])
  return { students, formations, sessions }
}

// ─────────────────────────────────────────────────────────────────
// Direct enrollment — bypass evaluation/signature workflow
// Creates FormationEnrollment + ModuleEnrollments immediately
// ─────────────────────────────────────────────────────────────────

export async function adminCreateDirectEnrollment(
  userId: string,
  formationId: string,
  trainingSessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Non autorisé.' }
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: 'Étudiant introuvable.' }

  const existing = await db.formationEnrollment.findFirst({
    where: { userId, trainingSessionId },
  })
  if (existing) {
    return { success: false, error: 'Cet étudiant est déjà inscrit à cette session.' }
  }

  await db.$transaction(async (tx) => {
    const enrollment = await tx.formationEnrollment.create({
      data: { userId, formationId, trainingSessionId, status: 'ACTIVE' },
    })

    const modules = await tx.module.findMany({ where: { formationId } })
    if (modules.length > 0) {
      await tx.moduleEnrollment.createMany({
        data: modules.map(m => ({
          userId,
          moduleId:             m.id,
          formationEnrollmentId: enrollment.id,
          status:               'ACTIVE',
        })),
      })
    }
  })

  revalidatePath('/admin/inscriptions')
  revalidatePath('/admin/students')
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Launch workflow — creates inscription + sends evaluation email
// ─────────────────────────────────────────────────────────────────

export async function adminLaunchInscriptionWorkflow(data: {
  firstName:         string
  lastName:          string
  email:             string
  phone:             string
  nationality:       string
  dateOfBirth:       string
  formationId:       string
  trainingSessionId?: string
}): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Non autorisé.' }
  }

  const { firstName, lastName, email, phone, nationality, dateOfBirth, formationId, trainingSessionId } = data

  if (!firstName || !lastName || !email || !phone || !formationId) {
    return { success: false, error: 'Tous les champs obligatoires doivent être renseignés.' }
  }

  const dob = dateOfBirth ? new Date(dateOfBirth) : undefined
  if (dateOfBirth && dob && isNaN(dob.getTime())) return { success: false, error: 'Date de naissance invalide.' }

  const existing = await db.inscription.findFirst({
    where: {
      email,
      formationId,
      status: { in: ['PENDING', 'EVALUATED', 'PENDING_SIGNATURE'] },
    },
  })
  if (existing) {
    return { success: false, error: 'Une demande est déjà en cours pour cet email et cette formation.' }
  }

  const inscription = await db.inscription.create({
    data: {
      firstName, lastName, email, phone,
      nationality: nationality || undefined,
      dateOfBirth: dob ?? undefined,
      formationId,
      ...(trainingSessionId ? { trainingSessionId } : {}),
      status: 'PENDING',
    },
  })

  const token     = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h
  await db.evaluationToken.create({
    data: { token, inscriptionId: inscription.id, expiresAt },
  })

  try {
    await sendEvaluationEmail(email, firstName, token)
  } catch (err) {
    console.error('[adminLaunchInscriptionWorkflow] Email send error:', err)
  }

  revalidatePath('/admin/inscriptions')
  return { success: true }
}
