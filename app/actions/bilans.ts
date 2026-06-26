'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import BilanPDF from '@/lib/pdf/bilan-template'
import { uploadToCloudinary } from '@/lib/inscription-service'

// ─────────────────────────────────────────
// Submit Bilan (Chaud or Froid)
// ─────────────────────────────────────────

export async function submitBilan(
  token: string,
  answers: Record<string, unknown>
) {
  try {
    // 1. Validate token
    const bilan = await db.formationBilan.findUnique({
      where: { token },
      include: {
        enrollment: {
          include: {
            user: { select: { name: true, email: true } },
            formation: { select: { title: true } },
          },
        },
      },
    })

    if (!bilan) {
      return { error: 'Lien invalide ou introuvable.' }
    }

    if (bilan.usedAt) {
      return { error: 'Ce bilan a déjà été soumis.' }
    }

    if (bilan.expiresAt < new Date()) {
      return { error: 'Ce lien a expiré (validité 30 jours).' }
    }

    // 2. Generate PDF
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await renderToBuffer(
        React.createElement(BilanPDF, {
          type: bilan.type as 'CHAUD' | 'FROID',
          studentName: bilan.enrollment.user.name,
          formationTitle: bilan.enrollment.formation.title,
          completedAt: new Date(),
          answers,
        }) as any
      )
    } catch (err) {
      console.error('[submitBilan] PDF generation error:', err)
      return { error: 'Erreur lors de la génération du PDF.' }
    }

    // 3. Upload to Cloudinary
    let pdfUrl: string
    try {
      pdfUrl = await uploadToCloudinary(
        pdfBuffer,
        `MIA Digital/bilans/${bilan.type.toLowerCase()}-${bilan.id}`
      )
    } catch (err) {
      console.error('[submitBilan] Cloudinary upload error:', err)
      return { error: 'Erreur lors de la sauvegarde du document.' }
    }

    // 4. Update bilan record
    await db.formationBilan.update({
      where: { id: bilan.id },
      data: {
        answers: answers as any,
        pdfUrl,
        usedAt: new Date(),
      },
    })

    revalidatePath(`/admin/formations/${bilan.enrollment.formationId}`)

    return { success: true, pdfUrl }
  } catch (err) {
    console.error('[submitBilan] Unexpected error:', err)
    return { error: 'Une erreur inattendue est survenue.' }
  }
}

// ─────────────────────────────────────────
// Get bilan stats for a formation (admin view)
// ─────────────────────────────────────────

export interface BilanStats {
  chaud: {
    sent: number
    completed: number
    completionRate: number
    avgOverallRating: number
    avgContentRating: number
    avgTrainerRating: number
    avgConfidenceRating: number
    avgWouldRecommend: number
  }
  froid: {
    sent: number
    completed: number
    completionRate: number
    examTakenRate: number
    examPassedRate: number
    avgApplyingRating: number
    avgProgressRating: number
    avgWouldRecommend: number
    needsSupportRate: number
  }
}

export async function getBilanStats(formationId: string): Promise<BilanStats> {
  // Get all bilans for this formation
  const bilans = await db.formationBilan.findMany({
    where: {
      enrollment: { formationId },
    },
    select: {
      type: true,
      usedAt: true,
      answers: true,
    },
  })

  const chaudBilans = bilans.filter((b) => b.type === 'CHAUD')
  const froidBilans = bilans.filter((b) => b.type === 'FROID')

  // Helpers
  const getAvg = (bilans: typeof chaudBilans, field: string): number => {
    const values = bilans
      .filter((b) => b.usedAt)
      .map((b) => (b.answers as any)?.[field])
      .filter((v) => typeof v === 'number')
    return values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : 0
  }

  const getRate = (bilans: typeof chaudBilans, field: string): number => {
    const completed = bilans.filter((b) => b.usedAt)
    if (completed.length === 0) return 0
    const yes = completed.filter((b) => (b.answers as any)?.[field] === true).length
    return Math.round((yes / completed.length) * 100)
  }

  return {
    chaud: {
      sent: chaudBilans.length,
      completed: chaudBilans.filter((b) => b.usedAt).length,
      completionRate:
        chaudBilans.length > 0
          ? Math.round((chaudBilans.filter((b) => b.usedAt).length / chaudBilans.length) * 100)
          : 0,
      avgOverallRating: getAvg(chaudBilans, 'overallRating'),
      avgContentRating: getAvg(chaudBilans, 'contentRating'),
      avgTrainerRating: getAvg(chaudBilans, 'trainerRating'),
      avgConfidenceRating: getAvg(chaudBilans, 'confidenceRating'),
      avgWouldRecommend: getAvg(chaudBilans, 'wouldRecommend'),
    },
    froid: {
      sent: froidBilans.length,
      completed: froidBilans.filter((b) => b.usedAt).length,
      completionRate:
        froidBilans.length > 0
          ? Math.round((froidBilans.filter((b) => b.usedAt).length / froidBilans.length) * 100)
          : 0,
      examTakenRate: getRate(froidBilans, 'examTaken'),
      examPassedRate: getRate(froidBilans, 'examPassed'),
      avgApplyingRating: getAvg(froidBilans, 'applyingRating'),
      avgProgressRating: getAvg(froidBilans, 'progressRating'),
      avgWouldRecommend: getAvg(froidBilans, 'wouldRecommend'),
      needsSupportRate: getRate(froidBilans, 'needsSupport'),
    },
  }
}

// ─────────────────────────────────────────
// Get all bilans for an enrollment
// ─────────────────────────────────────────

export async function getBilansForEnrollment(enrollmentId: string) {
  return db.formationBilan.findMany({
    where: { enrollmentId },
    select: {
      id: true,
      type: true,
      createdAt: true,
      usedAt: true,
      pdfUrl: true,
    },
  })
}
