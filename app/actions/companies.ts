'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { generatePassword } from '@/lib/generate-password'
import { sendCompanyWelcomeEmail } from '@/lib/email'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') throw new Error('Non autorisé.')
  return session
}

// ─────────────────────────────────────────────────────────────────
// List all companies
// ─────────────────────────────────────────────────────────────────

export async function getCompanies() {
  await requireAdmin()
  return db.company.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { employees: true, inscriptions: true } },
    },
  })
}

// ─────────────────────────────────────────────────────────────────
// Get one company with full detail
// ─────────────────────────────────────────────────────────────────

export async function getCompany(id: string) {
  await requireAdmin()
  return db.company.findUnique({
    where: { id },
    include: {
      employees: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      inscriptions: {
        include: {
          trainingSession: {
            include: { formation: { select: { title: true, type: true, duration: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

// ─────────────────────────────────────────────────────────────────
// Create company — admin creates manager account + sends credentials
// ─────────────────────────────────────────────────────────────────

export async function createCompany(data: {
  raisonSociale:   string
  nomDirigeant:    string
  prenomDirigeant: string
  fonction:        string
  email:           string
  phone:           string
  siret?:          string
  adresse?:        string
}): Promise<{ success: boolean; error?: string; companyId?: string }> {
  await requireAdmin()

  const { raisonSociale, nomDirigeant, prenomDirigeant, fonction, email, phone, siret, adresse } = data

  if (!raisonSociale || !nomDirigeant || !prenomDirigeant || !fonction || !email || !phone) {
    return { success: false, error: 'Tous les champs obligatoires doivent être renseignés.' }
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { success: false, error: 'Un compte existe déjà avec cet email.' }

  const plainPassword  = generatePassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  const company = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name:     `${prenomDirigeant} ${nomDirigeant}`,
        phone,
        role:     'COMPANY',
      },
    })

    return tx.company.create({
      data: {
        raisonSociale, nomDirigeant, prenomDirigeant,
        fonction, email, phone,
        siret:   siret   || undefined,
        adresse: adresse || undefined,
        userId:  user.id,
      },
    })
  })

  try {
    await sendCompanyWelcomeEmail(email, nomDirigeant, prenomDirigeant, raisonSociale, plainPassword)
  } catch (err) {
    console.error('[createCompany] Email send error:', err)
  }

  revalidatePath('/admin/entreprises')
  return { success: true, companyId: company.id }
}

// ─────────────────────────────────────────────────────────────────
// Add employee — creates student account + CompanyEmployee record
// ─────────────────────────────────────────────────────────────────

export async function addCompanyEmployee(
  companyId: string,
  data: { firstName: string; lastName: string; email?: string; phone?: string },
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const { firstName, lastName, email, phone } = data
  if (!firstName || !lastName) return { success: false, error: 'Prénom et nom requis.' }

  let userId: string | undefined

  if (email) {
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      // Re-use existing student account
      userId = existing.id
    } else {
      const plainPassword  = generatePassword()
      const hashedPassword = await bcrypt.hash(plainPassword, 12)
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name:     `${firstName} ${lastName}`,
          phone:    phone || undefined,
          role:     'STUDENT',
        },
      })
      userId = user.id
    }
  }

  // Check employee not already in company
  const existingEmployee = await db.companyEmployee.findFirst({
    where: { companyId, ...(userId ? { userId } : { firstName, lastName }) },
  })
  if (existingEmployee) {
    return { success: false, error: 'Ce salarié est déjà dans cette entreprise.' }
  }

  await db.companyEmployee.create({
    data: {
      companyId,
      firstName,
      lastName,
      email:  email  || undefined,
      phone:  phone  || undefined,
      userId: userId || undefined,
    },
  })

  revalidatePath(`/admin/entreprises/${companyId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Remove employee
// ─────────────────────────────────────────────────────────────────

export async function removeCompanyEmployee(
  employeeId: string,
  companyId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  await db.companyEmployee.delete({ where: { id: employeeId } })

  revalidatePath(`/admin/entreprises/${companyId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Create company inscription — link company to a training session
// ─────────────────────────────────────────────────────────────────

export async function createCompanyInscription(
  companyId: string,
  trainingSessionId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const existing = await db.companyInscription.findFirst({
    where: { companyId, trainingSessionId },
  })
  if (existing) {
    return { success: false, error: 'Cette entreprise est déjà inscrite à cette session.' }
  }

  await db.companyInscription.create({
    data: { companyId, trainingSessionId, status: 'PENDING' },
  })

  revalidatePath(`/admin/entreprises/${companyId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Upload plan d'accès to a company inscription
// ─────────────────────────────────────────────────────────────────

export async function updateCompanyInscriptionPlanAcces(
  inscriptionId: string,
  planAccesUrl: string,
  companyId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  await db.companyInscription.update({
    where: { id: inscriptionId },
    data:  { planAccesUrl },
  })

  revalidatePath(`/admin/entreprises/${companyId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Get training sessions for dropdown (admin)
// ─────────────────────────────────────────────────────────────────

export async function getTrainingSessionsForSelect() {
  await requireAdmin()
  return db.trainingSession.findMany({
    where:   { status: { not: 'CANCELLED' } },
    select:  {
      id: true, title: true, startDate: true, endDate: true,
      formation: { select: { title: true } },
    },
    orderBy: { startDate: 'asc' },
  })
}

// ─────────────────────────────────────────────────────────────────
// Company portal — fetch data for the manager dashboard
// ─────────────────────────────────────────────────────────────────

export async function getCompanyDashboard() {
  const session = await auth()
  if (!session || session.user.role !== 'COMPANY') throw new Error('Non autorisé.')

  const company = await db.company.findUnique({
    where: { userId: session.user.id },
    include: {
      employees: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      inscriptions: {
        include: {
          trainingSession: {
            include: {
              formation: { select: { title: true, type: true, duration: true } },
              trainer:   { include: { user: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  return company
}
