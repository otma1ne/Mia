'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { generatePassword } from '@/lib/generate-password'
import { sendCompanyWelcomeEmail, sendCompanySignatureRequestEmail } from '@/lib/email'
import { generateSigningDocuments } from '@/lib/pdf/generate-documents'
import type { Inscription, Formation } from '@prisma/client'

type InscriptionWithFormation = Inscription & { formation: Formation }

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
  raisonSociale:    string
  nomSignataire:    string
  prenomSignataire: string
  fonction:         string
  email:            string
  phone:            string
  siret?:           string
  adresse?:         string
  ville?:           string
  codePostal?:      string
}): Promise<{ success: boolean; error?: string; companyId?: string }> {
  await requireAdmin()

  const { raisonSociale, nomSignataire, prenomSignataire, fonction, email, phone, siret, adresse, ville, codePostal } = data

  if (!raisonSociale || !nomSignataire || !prenomSignataire || !fonction || !email || !phone) {
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
        name:     `${prenomSignataire} ${nomSignataire}`,
        phone,
        role:     'COMPANY',
      },
    })

    return tx.company.create({
      data: {
        raisonSociale, nomSignataire, prenomSignataire,
        fonction, email, phone,
        siret:      siret      || undefined,
        adresse:    adresse    || undefined,
        ville:      ville      || undefined,
        codePostal: codePostal || undefined,
        userId:  user.id,
      },
    })
  })

  try {
    await sendCompanyWelcomeEmail(email, nomSignataire, prenomSignataire, raisonSociale, plainPassword)
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
// Generate documents & send for signature (B2B)
// ─────────────────────────────────────────────────────────────────

export async function generateCompanyDocuments(
  companyInscriptionId: string,
  companyId: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const companyInscription = await db.companyInscription.findUnique({
    where: { id: companyInscriptionId },
    include: {
      company: true,
      trainingSession: { include: { formation: true } },
    },
  })

  if (!companyInscription) return { success: false, error: 'Inscription introuvable.' }
  if (companyInscription.status !== 'PENDING') {
    return { success: false, error: 'Les documents ont déjà été générés.' }
  }

  const center = await db.center.findFirst()
  if (!center) return { success: false, error: 'Les paramètres du centre sont introuvables.' }

  const { company, trainingSession } = companyInscription

  // Construct a signing-compatible object from company data
  const fakeInscription = {
    id:               companyInscription.id,
    firstName:        company.prenomSignataire,
    lastName:         company.nomSignataire,
    email:            company.email,
    phone:            company.phone,
    nationality:      null,
    dateOfBirth:      null,
    postalAddress:    company.adresse,
    poleEmploiId:     null,
    cvUrl:            null,
    status:           'EVALUATED' as const,
    source:           'FORM' as const,
    formationId:      trainingSession.formationId,
    formation:        trainingSession.formation,
    trainingSessionId: trainingSession.id,
    contactId:        null,
    adminNote:        null,
    evaluationData:   null,
    evaluationPdfUrl: null,
    contratUrl:       null,
    reglementUrl:     null,
    cgvUrl:           null,
    programmeUrl:     null,
    signatureDataUrl: null,
    signedIp:         null,
    signedContratUrl: null,
    signedReglementUrl: null,
    signedCgvUrl:     null,
    signedProgrammeUrl: null,
    signedAt:         null,
    createdAt:        company.createdAt,
    updatedAt:        company.updatedAt,
  } as InscriptionWithFormation

  let documentUrls: { contratUrl: string; reglementUrl: string; cgvUrl: string; programmeUrl: string }
  try {
    documentUrls = await generateSigningDocuments({ inscription: fakeInscription, center })
  } catch (err) {
    if (err instanceof Error) return { success: false, error: err.message }
    return { success: false, error: 'Erreur lors de la génération des documents. Veuillez réessayer.' }
  }

  const token     = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  await db.companyInscription.update({
    where: { id: companyInscriptionId },
    data: {
      status:                 'PENDING_SIGNATURE',
      contratUrl:             documentUrls.contratUrl,
      reglementUrl:           documentUrls.reglementUrl,
      cgvUrl:                 documentUrls.cgvUrl,
      signatureToken:         token,
      signatureTokenExpiresAt: expiresAt,
    },
  })

  try {
    await sendCompanySignatureRequestEmail(company.email, company.prenomSignataire, token)
  } catch (err) {
    console.error('[generateCompanyDocuments] Email send error:', err)
  }

  revalidatePath(`/admin/entreprises/${companyId}`)
  return { success: true }
}

// ─────────────────────────────────────────────────────────────────
// Submit company signature (public — validates by token)
// ─────────────────────────────────────────────────────────────────

export async function submitCompanySignature(
  token: string,
  signatureDataUrl: string,
): Promise<{ error?: string }> {
  if (!signatureDataUrl.startsWith('data:image/png;base64,') || signatureDataUrl.length > 500_000) {
    return { error: 'Signature invalide. Veuillez réessayer.' }
  }

  const companyInscription = await db.companyInscription.findUnique({
    where: { signatureToken: token },
    include: {
      company: {
        include: {
          employees: {
            where: { userId: { not: null } },
          },
        },
      },
      trainingSession: {
        include: {
          formation: {
            include: { modules: true },
          },
        },
      },
    },
  })

  if (!companyInscription) return { error: 'Lien invalide.' }
  if (companyInscription.status !== 'PENDING_SIGNATURE') return { error: 'Ce lien n\'est plus valide.' }
  if (
    companyInscription.signatureTokenExpiresAt &&
    companyInscription.signatureTokenExpiresAt < new Date()
  ) {
    return { error: 'Ce lien a expiré. Contactez notre équipe pour obtenir un nouveau lien.' }
  }

  const center = await db.center.findFirst()
  if (!center) return { error: 'Les paramètres du centre sont introuvables.' }

  const { company, trainingSession } = companyInscription

  const fakeInscription = {
    id:               companyInscription.id,
    firstName:        company.prenomSignataire,
    lastName:         company.nomSignataire,
    email:            company.email,
    phone:            company.phone,
    nationality:      null,
    dateOfBirth:      null,
    postalAddress:    company.adresse,
    poleEmploiId:     null,
    cvUrl:            null,
    status:           'ACCEPTED' as const,
    source:           'FORM' as const,
    formationId:      trainingSession.formationId,
    formation:        trainingSession.formation,
    trainingSessionId: trainingSession.id,
    contactId:        null,
    adminNote:        null,
    evaluationData:   null,
    evaluationPdfUrl: null,
    contratUrl:       companyInscription.contratUrl,
    reglementUrl:     companyInscription.reglementUrl,
    cgvUrl:           companyInscription.cgvUrl,
    programmeUrl:     null,
    signatureDataUrl: null,
    signedIp:         null,
    signedContratUrl: null,
    signedReglementUrl: null,
    signedCgvUrl:     null,
    signedProgrammeUrl: null,
    signedAt:         null,
    createdAt:        company.createdAt,
    updatedAt:        company.updatedAt,
  } as InscriptionWithFormation

  const signedAt = new Date()
  let signedUrls: { contratUrl: string; reglementUrl: string; cgvUrl: string; programmeUrl: string }
  try {
    signedUrls = await generateSigningDocuments({
      inscription: fakeInscription,
      center,
      signature: { dataUrl: signatureDataUrl, signedAt },
    })
  } catch (err) {
    if (err instanceof Error) return { error: err.message }
    return { error: 'Erreur lors de la génération du contrat signé. Veuillez réessayer.' }
  }

  await db.$transaction(async (tx) => {
    await tx.companyInscription.update({
      where: { id: companyInscription.id },
      data: {
        status:          'ACCEPTED',
        signedContratUrl: signedUrls.contratUrl,
        signatureDataUrl,
        signedAt,
        signatureToken:  null,
      },
    })

    const modules = trainingSession.formation.modules

    for (const employee of company.employees) {
      if (!employee.userId) continue

      const existing = await tx.formationEnrollment.findFirst({
        where: { userId: employee.userId, trainingSessionId: trainingSession.id },
      })
      if (existing) continue

      const enrollment = await tx.formationEnrollment.create({
        data: {
          userId:            employee.userId,
          formationId:       trainingSession.formationId,
          trainingSessionId: trainingSession.id,
          status:            'ACTIVE',
        },
      })

      if (modules.length > 0) {
        await tx.moduleEnrollment.createMany({
          data: modules.map(m => ({
            userId:               employee.userId as string,
            moduleId:             m.id,
            formationEnrollmentId: enrollment.id,
            status:               'ACTIVE',
          })),
        })
      }
    }
  })

  return {}
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
