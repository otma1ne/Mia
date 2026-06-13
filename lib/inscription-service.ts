// Plain service module — no 'use server', safe to import from both
// route handlers and server actions.

import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'
import { sendAcceptanceEmail, sendEnrollmentConfirmationEmail } from '@/lib/email'
import { generatePassword } from '@/lib/generate-password'
import { downloadSignedDocument } from '@/lib/yousign'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// Upload a buffer to Cloudinary
// ─────────────────────────────────────────

export async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        'edudrive/signed-docs',
        resource_type: 'raw',
        format:        'pdf',
        public_id:     publicId,
        overwrite:     true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(buffer)
  })
}

// ─────────────────────────────────────────
// Download signed PDFs from YouSign and store in Cloudinary
// Returns null if the inscription is missing doc IDs (e.g. manually confirmed)
// ─────────────────────────────────────────

async function downloadAndStoreSignedDocs(inscription: {
  id: string
  yousignRequestId:      string | null
  yousignContratDocId:   string | null
  yousignReglementDocId: string | null
  yousignCgvDocId:       string | null
}): Promise<{ contrat: string; reglement: string; cgv: string } | null> {
  const {
    id,
    yousignRequestId,
    yousignContratDocId,
    yousignReglementDocId,
    yousignCgvDocId,
  } = inscription

  if (!yousignRequestId || !yousignContratDocId || !yousignReglementDocId || !yousignCgvDocId) {
    console.warn('[downloadAndStoreSignedDocs] Missing YouSign IDs for inscription:', id)
    return null
  }

  const docs = [
    { key: 'contrat',   docId: yousignContratDocId   },
    { key: 'reglement', docId: yousignReglementDocId  },
    { key: 'cgv',       docId: yousignCgvDocId        },
  ] as const

  const urls: Record<string, string> = {}

  await Promise.all(docs.map(async ({ key, docId }) => {
    const buffer = await downloadSignedDocument(yousignRequestId, docId)
    urls[key] = await uploadToCloudinary(buffer, `${id}-signed-${key}`)
  }))

  return urls as { contrat: string; reglement: string; cgv: string }
}

// ─────────────────────────────────────────
// Main: process completed signature
// ─────────────────────────────────────────

export async function processSignatureComplete(inscriptionId: string): Promise<void> {
  const inscription = await db.inscription.findUnique({
    where: { id: inscriptionId },
    include: { formation: { select: { title: true } } },
  })

  if (!inscription) {
    console.warn('[processSignatureComplete] Inscription not found:', inscriptionId)
    return
  }

  // Idempotent
  if (inscription.status === 'ACCEPTED') {
    console.log('[processSignatureComplete] Already accepted, skipping:', inscriptionId)
    return
  }

  const existingUser = await db.user.findUnique({ where: { email: inscription.email } })

  if (existingUser) {
    // Existing student — enroll in the new formation (no account creation needed)
    // Check for duplicate enrollment
    const existingEnrollment = await db.formationEnrollment.findFirst({
      where: { userId: existingUser.id, formationId: inscription.formationId },
    })
    if (existingEnrollment) {
      console.warn('[processSignatureComplete] User already enrolled:', {
        userId: existingUser.id,
        formationId: inscription.formationId,
      })
      return
    }

    await db.$transaction(async (tx) => {
      // Create formation enrollment
      const formationEnrollment = await tx.formationEnrollment.create({
        data: { userId: existingUser.id, formationId: inscription.formationId, status: 'ACTIVE' },
      })

      // Get all modules for this formation and create module enrollments
      const modules = await tx.module.findMany({
        where: { formationId: inscription.formationId },
      })

      if (modules.length > 0) {
        await tx.moduleEnrollment.createMany({
          data: modules.map(module => ({
            userId: existingUser.id,
            moduleId: module.id,
            formationEnrollmentId: formationEnrollment.id,
            status: 'ACTIVE',
          })),
        })
      }

      await tx.inscription.update({
        where: { id: inscriptionId },
        data:  { status: 'ACCEPTED' },
      })
    })

    revalidatePath('/admin/inscriptions')

    // Download signed PDFs (non-fatal)
    try {
      const signedUrls = await downloadAndStoreSignedDocs(inscription)
      if (signedUrls) {
        await db.inscription.update({
          where: { id: inscriptionId },
          data: {
            signedContratUrl:   signedUrls.contrat,
            signedReglementUrl: signedUrls.reglement,
            signedCgvUrl:       signedUrls.cgv,
            signedAt:           new Date(),
          },
        })
      }
    } catch (err) {
      console.error('[processSignatureComplete] Failed to download/store signed docs (existing user):', err)
    }

    // Send enrollment confirmation email (non-fatal)
    try {
      await sendEnrollmentConfirmationEmail(
        inscription.email,
        inscription.firstName,
        inscription.formation.title
      )
    } catch (err) {
      console.error('[processSignatureComplete] Failed to send enrollment confirmation email:', err)
    }

    return
  }

  // New user — create account + enroll
  const plainPassword  = generatePassword()
  const hashedPassword = await bcrypt.hash(plainPassword, 12)

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email:    inscription.email,
        password: hashedPassword,
        name:     `${inscription.firstName} ${inscription.lastName}`,
        phone:    inscription.phone,
        role:     'STUDENT',
      },
    })

    // Create formation enrollment
    const formationEnrollment = await tx.formationEnrollment.create({
      data: { userId: user.id, formationId: inscription.formationId, status: 'ACTIVE' },
    })

    // Get all modules for this formation and create module enrollments
    const modules = await tx.module.findMany({
      where: { formationId: inscription.formationId },
    })

    if (modules.length > 0) {
      await tx.moduleEnrollment.createMany({
        data: modules.map(module => ({
          userId: user.id,
          moduleId: module.id,
          formationEnrollmentId: formationEnrollment.id,
          status: 'ACTIVE',
        })),
      })
    }

    await tx.inscription.update({
      where: { id: inscriptionId },
      data:  { status: 'ACCEPTED' },
    })
  })

  revalidatePath('/admin/inscriptions')

  // Download signed PDFs from YouSign and store in Cloudinary (non-fatal)
  try {
    const signedUrls = await downloadAndStoreSignedDocs(inscription)
    if (signedUrls) {
      await db.inscription.update({
        where: { id: inscriptionId },
        data: {
          signedContratUrl:   signedUrls.contrat,
          signedReglementUrl: signedUrls.reglement,
          signedCgvUrl:       signedUrls.cgv,
          signedAt:           new Date(),
        },
      })
      console.log('[processSignatureComplete] Signed docs stored for:', inscriptionId)
    }
  } catch (err) {
    console.error('[processSignatureComplete] Failed to download/store signed docs:', err)
  }

  // Send welcome email with password (non-fatal)
  try {
    await sendAcceptanceEmail(
      inscription.email,
      inscription.firstName,
      inscription.formation.title,
      plainPassword
    )
  } catch (err) {
    console.error('[processSignatureComplete] Failed to send welcome email:', err)
  }
}
