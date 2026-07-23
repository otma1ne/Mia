// Plain service module — no 'use server', safe to import from both
// route handlers and server actions.

import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'
import { sendAcceptanceEmail, sendEnrollmentConfirmationEmail } from '@/lib/email'
import { generatePassword } from '@/lib/generate-password'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// Upload a buffer to Cloudinary
// ─────────────────────────────────────────

export async function uploadToCloudinary(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        'mia-formation/signed-docs',
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
// Main: process completed signature
// signedUrls are the already-generated, already-uploaded signed PDFs
// (produced by generateSigningDocuments with a `signature` prop)
// ─────────────────────────────────────────

export async function processSignatureComplete(
  inscriptionId: string,
  signedUrls: { contrat: string; reglement: string; cgv: string; programme: string }
): Promise<void> {
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

  if (!inscription.trainingSessionId) {
    console.error('[processSignatureComplete] No trainingSessionId on inscription — cannot create enrollment:', inscriptionId)
    return
  }

  const trainingSessionId = inscription.trainingSessionId

  const existingUser = await db.user.findUnique({ where: { email: inscription.email } })

  if (existingUser) {
    // Existing student — enroll in the session (no account creation needed)
    const existingEnrollment = await db.formationEnrollment.findFirst({
      where: { userId: existingUser.id, trainingSessionId },
    })
    if (existingEnrollment) {
      console.warn('[processSignatureComplete] User already enrolled in this session:', {
        userId: existingUser.id,
        trainingSessionId,
      })
      return
    }

    await db.$transaction(async (tx) => {
      const formationEnrollment = await tx.formationEnrollment.create({
        data: { userId: existingUser.id, formationId: inscription.formationId, trainingSessionId, status: 'ACTIVE' },
      })

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
        data: {
          status:             'ACCEPTED',
          signedContratUrl:   signedUrls.contrat,
          signedReglementUrl: signedUrls.reglement,
          signedCgvUrl:       signedUrls.cgv,
          signedProgrammeUrl: signedUrls.programme,
          signedAt:           new Date(),
        },
      })
    })

    revalidatePath('/admin/inscriptions')

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

    const formationEnrollment = await tx.formationEnrollment.create({
      data: { userId: user.id, formationId: inscription.formationId, trainingSessionId, status: 'ACTIVE' },
    })

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
      data: {
        status:             'ACCEPTED',
        signedContratUrl:   signedUrls.contrat,
        signedReglementUrl: signedUrls.reglement,
        signedCgvUrl:       signedUrls.cgv,
        signedProgrammeUrl: signedUrls.programme,
        signedAt:           new Date(),
      },
    })
  })

  revalidatePath('/admin/inscriptions')

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
