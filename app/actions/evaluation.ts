'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export interface EvaluationAnswers {
  overallRating: number    // 1-5
  contentRating: number    // 1-5
  trainerRating: number    // 1-5
  wouldRecommend: boolean
  bestLearning: string
  suggestions: string
}

const EVAL_TYPE = 'EVALUATION_FINALE'

export async function getEvaluationState(formationId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  const enrollment = await db.formationEnrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
    select: {
      id: true,
      bilans: {
        where: { type: EVAL_TYPE },
        select: { answers: true, createdAt: true },
      },
    },
  })

  if (!enrollment) return null

  const existing = enrollment.bilans[0] ?? null
  return {
    enrollmentId: enrollment.id,
    submitted: !!existing,
    submittedAt: existing?.createdAt ?? null,
    answers: (existing?.answers ?? null) as EvaluationAnswers | null,
  }
}

export async function submitFormationEvaluation(
  formationId: string,
  answers: EvaluationAnswers
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Non authentifié.' }
  const userId = session.user.id

  if (
    answers.overallRating < 1 || answers.overallRating > 5 ||
    answers.contentRating < 1 || answers.contentRating > 5 ||
    answers.trainerRating < 1 || answers.trainerRating > 5
  ) {
    return { error: 'Notes invalides.' }
  }

  const enrollment = await db.formationEnrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
    select: { id: true },
  })
  if (!enrollment) return { error: 'Inscription introuvable.' }

  const existing = await db.formationBilan.findUnique({
    where: { enrollmentId_type: { enrollmentId: enrollment.id, type: EVAL_TYPE } },
  })
  if (existing) return { error: 'Évaluation déjà soumise.' }

  await db.formationBilan.create({
    data: {
      enrollmentId: enrollment.id,
      type: EVAL_TYPE,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usedAt: new Date(),
      answers: answers as unknown as Record<string, unknown>,
    },
  })

  revalidatePath(`/student/formations/${formationId}/evaluation`)
  return { success: true }
}
