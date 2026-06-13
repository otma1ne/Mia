'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { sendEvaluationEmail, sendDeclineEmail } from '@/lib/email'
import { processSignatureComplete } from '@/lib/inscription-service'
import { createSignatureRequest, YouSignError } from '@/lib/yousign'
import { generateSigningDocuments } from '@/lib/pdf/generate-documents'
import { cloudinary } from '@/lib/cloudinary'
import { EVALUATION_FIELDS, type EvaluationData } from '@/lib/evaluation-config'
import EvaluationPDF from '@/lib/pdf/evaluation-template'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import React from 'react'

// ─────────────────────────────────────────
// createInscription
// Public action — no auth required
// ─────────────────────────────────────────

export async function createInscription(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const firstName   = (formData.get('firstName')   as string)?.trim()
  const lastName    = (formData.get('lastName')    as string)?.trim()
  const email       = (formData.get('email')       as string)?.trim().toLowerCase()
  const phone       = (formData.get('phone')       as string)?.trim()
  const formationId = (formData.get('formationId') as string)?.trim()
  const cvUrl       = (formData.get('cvUrl')       as string)?.trim()

  // Validate required fields
  if (!firstName || !lastName || !email || !phone || !formationId || !cvUrl) {
    return { error: 'Tous les champs sont obligatoires.' }
  }

  // Check email not already a registered user
  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Un compte existe déjà avec cet email. Veuillez vous connecter.' }
  }

  // Check no pending/evaluated inscription for same email + formation
  const existing = await db.inscription.findFirst({
    where: {
      email,
      formationId,
      status: { in: ['PENDING', 'EVALUATED'] },
    },
  })
  if (existing) {
    return { error: 'Une demande est déjà en cours pour cette formation avec cet email.' }
  }

  // Create inscription
  const inscription = await db.inscription.create({
    data: { firstName, lastName, email, phone, formationId, cvUrl, status: 'PENDING' },
  })

  // Create evaluation token (24h expiry)
  const token     = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.evaluationToken.create({
    data: { inscriptionId: inscription.id, token, expiresAt },
  })

  // Send evaluation email
  try {
    await sendEvaluationEmail(email, firstName, token)
  } catch (err) {
    console.error('[inscription] Failed to send email:', err)
    // Don't fail the inscription if email fails — token is still in DB
  }

  return { success: true }
}

// ─────────────────────────────────────────
// createInscriptionAsStudent
// Authenticated action — for logged-in students applying to a new formation
// ─────────────────────────────────────────

export async function createInscriptionAsStudent(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const session = await auth()
  if (!session) return { error: 'Vous devez être connecté.' }

  const formationId = (formData.get('formationId') as string)?.trim()
  const cvUrl       = (formData.get('cvUrl')       as string)?.trim()

  if (!formationId || !cvUrl) {
    return { error: 'Tous les champs sont obligatoires.' }
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user) return { error: 'Utilisateur introuvable.' }

  const email     = user.email
  const nameParts = user.name.trim().split(' ')
  const firstName = nameParts[0]
  const lastName  = nameParts.slice(1).join(' ') || nameParts[0]
  const phone     = user.phone ?? ''

  // Check no pending/evaluated inscription for same email + formation
  const existing = await db.inscription.findFirst({
    where: {
      email,
      formationId,
      status: { in: ['PENDING', 'EVALUATED', 'PENDING_SIGNATURE'] },
    },
  })
  if (existing) {
    return { error: 'Une demande est déjà en cours pour cette formation.' }
  }

  // Check not already enrolled
  const enrolled = await db.formationEnrollment.findUnique({
    where: { userId_formationId: { userId: user.id, formationId } },
  })
  if (enrolled) {
    return { error: 'Vous êtes déjà inscrit à cette formation.' }
  }

  const inscription = await db.inscription.create({
    data: { firstName, lastName, email, phone, formationId, cvUrl, status: 'PENDING' },
  })

  const token     = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.evaluationToken.create({
    data: { inscriptionId: inscription.id, token, expiresAt },
  })

  try {
    await sendEvaluationEmail(email, firstName, token)
  } catch (err) {
    console.error('[createInscriptionAsStudent] Failed to send email:', err)
  }

  return { success: true }
}

// ─────────────────────────────────────────
// submitEvaluation
// Public action — validated by token
// ─────────────────────────────────────────

export async function submitEvaluation(
  token: string,
  data: EvaluationData
): Promise<{ error?: string }> {
  // Validate token
  const evalToken = await db.evaluationToken.findUnique({
    where: { token },
    include: {
      inscription: {
        include: { formation: { select: { title: true } } },
      },
    },
  })

  if (!evalToken)                         return { error: 'Lien invalide.' }
  if (evalToken.usedAt)                   return { error: 'Ce lien a déjà été utilisé.' }
  if (evalToken.expiresAt < new Date())   return { error: 'Ce lien a expiré.' }

  const { inscription } = evalToken

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    React.createElement(EvaluationPDF, {
      firstName:      inscription.firstName,
      lastName:       inscription.lastName,
      email:          inscription.email,
      phone:          inscription.phone,
      formationTitle: inscription.formation.title,
      evaluationData: data,
      submittedAt:    new Date(),
    }) as React.ReactElement<DocumentProps>
  )

  // Upload PDF to Cloudinary
  const evaluationPdfUrl = await new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        'edudrive/evaluations',
        resource_type: 'raw',
        format:        'pdf',
        public_id:     `evaluation-${inscription.id}`,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'))
        resolve(result.secure_url)
      }
    )
    stream.end(pdfBuffer)
  })

  // Update inscription
  await db.inscription.update({
    where: { id: inscription.id },
    data:  { evaluationData: data, evaluationPdfUrl, status: 'EVALUATED' },
  })

  // Mark token as used
  await db.evaluationToken.update({
    where: { id: evalToken.id },
    data:  { usedAt: new Date() },
  })

  redirect('/evaluation/merci')
}

// ─────────────────────────────────────────
// acceptInscription — admin only
// ─────────────────────────────────────────

export async function acceptInscription(id: string): Promise<{ error?: string }> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return { error: 'Non autorisé.' }

  const inscription = await db.inscription.findUnique({
    where: { id },
    include: { formation: true },
  })
  if (!inscription) return { error: 'Demande introuvable.' }

  // Only EVALUATED inscriptions can be accepted
  if (inscription.status !== 'EVALUATED') return { error: 'Statut invalide pour cette action.' }

  // Fetch center info — required for PDF generation
  const center = await db.center.findFirst()
  if (!center) return { error: 'Les paramètres du centre sont introuvables. Veuillez configurer le centre.' }

  // Generate the 4 signing documents (validates règlement/CGV/programme content)
  let documentUrls: { contrat: string; reglement: string; cgv: string; programme: string }
  try {
    const { contratUrl, reglementUrl, cgvUrl, programmeUrl } = await generateSigningDocuments({ inscription, center })
    documentUrls = { contrat: contratUrl, reglement: reglementUrl, cgv: cgvUrl, programme: programmeUrl }
  } catch (err) {
    if (err instanceof Error) return { error: err.message }
    return { error: 'Erreur lors de la génération des documents. Veuillez réessayer.' }
  }

  // Create YouSign signature request — student will receive signing email
  let yousignRequestId: string
  let yousignDocumentIds: { contrat: string; reglement: string; cgv: string }
  try {
    const result = await createSignatureRequest(
      {
        firstName: inscription.firstName,
        lastName:  inscription.lastName,
        email:     inscription.email,
      },
      inscription.formation.title,
      documentUrls
    )
    yousignRequestId  = result.requestId
    yousignDocumentIds = result.documentIds
  } catch (err) {
    console.error('[acceptInscription] YouSign error:', err)
    if (err instanceof YouSignError) {
      return { error: `Erreur lors de la création de la demande de signature (étape: ${err.step}). Veuillez réessayer.` }
    }
    return { error: 'Erreur inattendue. Veuillez réessayer.' }
  }

  // Update inscription: waiting for student e-signature + save doc IDs for later download
  await db.inscription.update({
    where: { id },
    data: {
      status:               'PENDING_SIGNATURE',
      yousignRequestId,
      yousignContratDocId:   yousignDocumentIds.contrat,
      yousignReglementDocId: yousignDocumentIds.reglement,
      yousignCgvDocId:       yousignDocumentIds.cgv,
    },
  })

  revalidatePath('/admin/inscriptions')
  return {}
}

// ─────────────────────────────────────────
// declineInscription — admin only
// ─────────────────────────────────────────

export async function declineInscription(
  id: string,
  note?: string
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return { error: 'Non autorisé.' }

  const inscription = await db.inscription.findUnique({
    where: { id },
    include: { formation: { select: { title: true } } },
  })
  if (!inscription) return { error: 'Demande introuvable.' }

  await db.inscription.update({
    where: { id },
    data:  { status: 'DECLINED', adminNote: note ?? null },
  })

  // Send decline email
  try {
    await sendDeclineEmail(
      inscription.email,
      inscription.firstName,
      inscription.formation.title,
      note
    )
  } catch (err) {
    console.error('[declineInscription] Failed to send email:', err)
  }

  revalidatePath('/admin/inscriptions')
  return {}
}

// ─────────────────────────────────────────
// getInscriptions — admin only (server query)
// ─────────────────────────────────────────

export async function getInscriptions() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return []

  return db.inscription.findMany({
    include: { formation: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

// ─────────────────────────────────────────
// confirmSignatureManually — admin only
// For cases where the webhook fails to fire
// ─────────────────────────────────────────

export async function confirmSignatureManually(id: string): Promise<{ error?: string }> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return { error: 'Non autorisé.' }

  const inscription = await db.inscription.findUnique({ where: { id } })
  if (!inscription) return { error: 'Demande introuvable.' }
  if (inscription.status !== 'PENDING_SIGNATURE') return { error: 'Statut invalide pour cette action.' }

  await processSignatureComplete(id)
  return {}
}

export async function getPendingEvaluatedCount() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return 0

  return db.inscription.count({
    where: { status: { in: ['PENDING', 'EVALUATED'] } },
  })
}
