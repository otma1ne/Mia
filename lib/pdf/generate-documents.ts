import React from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { cloudinary } from '@/lib/cloudinary'
import ContratPDF    from './contrat-template'
import ReglementPDF  from './reglement-template'
import CGVPDF        from './cgv-template'
import ProgrammePDF  from './programme-template'
import type { Inscription, Formation, Center } from '@prisma/client'

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
}): Promise<{
  contratUrl: string
  reglementUrl: string
  cgvUrl: string
  programmeUrl: string
}> {
  const { inscription, center } = params
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
        startDate:         formation.startDate,
        endDate:           formation.endDate,
        centerName:        center.name,
        centerAddress:     center.address,
        centerPhone:       center.phone,
        centerEmail:       center.email,
        generatedAt,
      }) as React.ReactElement<DocumentProps>
    ),

    renderToBuffer(
      React.createElement(ReglementPDF, {
        content:     center.reglement,
        centerName:  center.name,
        generatedAt,
      }) as React.ReactElement<DocumentProps>
    ),

    renderToBuffer(
      React.createElement(CGVPDF, {
        content:     center.cgv,
        centerName:  center.name,
        generatedAt,
      }) as React.ReactElement<DocumentProps>
    ),

    renderToBuffer(
      React.createElement(ProgrammePDF, {
        formationTitle:    formation.title,
        formationType,
        formationDuration: formation.duration,
        startDate:         formation.startDate,
        endDate:           formation.endDate,
        programme:         formation.programme,
        centerName:        center.name,
        generatedAt,
      }) as React.ReactElement<DocumentProps>
    ),
  ])

  // ── Upload all 4 PDFs to Cloudinary in parallel ───────────────────────────

  const [contratUrl, reglementUrl, cgvUrl, programmeUrl] = await Promise.all([
    uploadPdf(contratBuffer,   `${id}-contrat`),
    uploadPdf(reglementBuffer, `${id}-reglement`),
    uploadPdf(cgvBuffer,       `${id}-cgv`),
    uploadPdf(programmeBuffer, `${id}-programme`),
  ])

  return { contratUrl, reglementUrl, cgvUrl, programmeUrl }
}
