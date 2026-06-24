import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { cloudinary } from '@/lib/cloudinary'
import ContratPDF    from './contrat-template'
import ReglementPDF  from './reglement-template'
import CGVPDF        from './cgv-template'
import ProgrammePDF  from './programme-template'
import AttestationPDF from './attestation-template'
import type { Inscription, Formation, Center } from '@prisma/client'
import { getFormationDateRange } from '@/app/actions/formations'

type InscriptionWithFormation = Inscription & { formation: Formation }

// ─────────────────────────────────────────
// Upload a PDF buffer to Cloudinary
// ─────────────────────────────────────────

async function uploadPdf(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        'mia-formation/signing-docs',
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
// Generate all 4 signing documents
// ─────────────────────────────────────────

export async function generateSigningDocuments(params: {
  inscription: InscriptionWithFormation
  center: Center
  signature?: { dataUrl: string; signedAt: Date }
}): Promise<{
  contratUrl: string
  reglementUrl: string
  cgvUrl: string
  programmeUrl: string
}> {
  const { inscription, center, signature } = params
  const { formation } = inscription

  // Validate required content
  if (!center.reglement?.trim()) {
    throw new Error(
      'Le règlement intérieur n\'a pas encore été rédigé. Veuillez le compléter dans les paramètres du centre.'
    )
  }
  if (!center.cgv?.trim()) {
    throw new Error(
      'Les CGV n\'ont pas encore été rédigées. Veuillez les compléter dans les paramètres du centre.'
    )
  }
  if (!formation.programme?.trim()) {
    throw new Error(
      'Le programme de cette formation n\'a pas encore été rédigé. Veuillez le compléter dans les paramètres de la formation.'
    )
  }

  const generatedAt = new Date()
  const id          = inscription.id
  const { startDate, endDate } = await getFormationDateRange(formation.id)

  const formationType = formation.type === 'PRESENTIAL' ? 'Présentiel' :
                        formation.type === 'REMOTE_LIVE' ? 'À distance (live)' :
                        'À distance (auto-rythmé)'

  // ── Generate all 4 PDFs in parallel ──────────────────────────────────────

  const [contratBuffer, reglementBuffer, cgvBuffer, programmeBuffer] = await Promise.all([
    renderToBuffer(
      React.createElement(ContratPDF, {
        firstName:         inscription.firstName,
        lastName:          inscription.lastName,
        email:             inscription.email,
        phone:             inscription.phone,
        formationTitle:    formation.title,
        formationType,
        formationDuration: formation.duration,
        formationPrice:    formation.price,
        startDate,
        endDate,
        centerName:        center.name,
        centerAddress:     center.address,
        centerPhone:       center.phone,
        centerEmail:       center.email,
        generatedAt,
        signature,
      }) as React.ReactElement<DocumentProps>
    ),

    renderToBuffer(
      React.createElement(ReglementPDF, {
        content:     center.reglement,
        centerName:  center.name,
        generatedAt,
        signature,
      }) as React.ReactElement<DocumentProps>
    ),

    renderToBuffer(
      React.createElement(CGVPDF, {
        content:     center.cgv,
        centerName:  center.name,
        generatedAt,
        signature,
      }) as React.ReactElement<DocumentProps>
    ),

    renderToBuffer(
      React.createElement(ProgrammePDF, {
        formationTitle:    formation.title,
        formationType,
        formationDuration: formation.duration,
        startDate,
        endDate,
        programme:         formation.programme,
        centerName:        center.name,
        generatedAt,
        signature,
      }) as React.ReactElement<DocumentProps>
    ),
  ])

  // ── Upload all 4 PDFs to Cloudinary in parallel ───────────────────────────

  const suffix = signature ? '-signed' : ''

  const [contratUrl, reglementUrl, cgvUrl, programmeUrl] = await Promise.all([
    uploadPdf(contratBuffer,   `${id}-contrat${suffix}`),
    uploadPdf(reglementBuffer, `${id}-reglement${suffix}`),
    uploadPdf(cgvBuffer,       `${id}-cgv${suffix}`),
    uploadPdf(programmeBuffer, `${id}-programme${suffix}`),
  ])

  return { contratUrl, reglementUrl, cgvUrl, programmeUrl }
}

// ─────────────────────────────────────────
// Generate attestation de fin de formation
// ─────────────────────────────────────────

export async function generateAttestation(params: {
  enrollmentId: string
  studentName: string
  formation: Pick<Formation, 'id' | 'title' | 'type' | 'duration'>
  center: Pick<Center, 'name' | 'address'>
}): Promise<string> {
  const { enrollmentId, studentName, formation, center } = params

  const { startDate, endDate } = await getFormationDateRange(formation.id)

  const formationType = formation.type === 'PRESENTIAL' ? 'Présentiel' :
                        formation.type === 'REMOTE_LIVE' ? 'À distance (live)' :
                        'À distance (auto-rythmé)'

  const buffer = await renderToBuffer(
    React.createElement(AttestationPDF, {
      studentName,
      formationTitle:    formation.title,
      formationType,
      formationDuration: formation.duration,
      startDate,
      endDate,
      centerName:    center.name,
      centerAddress: center.address,
      issuedAt:      new Date(),
    }) as React.ReactElement<DocumentProps>
  )

  return uploadPdf(buffer, `attestation-${enrollmentId}`)
}
