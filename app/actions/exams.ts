'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { QuestionType } from '@prisma/client'
import { sendGradingNotificationEmail } from '@/lib/email'

// ─────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/unauthorized')
  return session
}

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session
}

async function requireTrainerOrAdmin() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (!['ADMIN', 'TRAINER'].includes(session.user.role as string)) redirect('/unauthorized')
  return session
}

// ═════════════════════════════════════════════════════════════════
// ADMIN — Exam CRUD
// ═════════════════════════════════════════════════════════════════

export async function getExamForAdmin(moduleId: string) {
  await requireAdmin()
  return db.exam.findUnique({
    where: { moduleId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        include: { choices: { orderBy: { orderIndex: 'asc' } } },
      },
      module: { select: { id: true, title: true, type: true, formationId: true } },
    },
  })
}

export interface ExamFormData {
  title: string
  description?: string | null
  passingScore: number
  timeLimit?: number | null
  shuffleQuestions?: boolean
}

export async function createOrUpdateExam(moduleId: string, data: ExamFormData) {
  await requireAdmin()

  const module = await db.module.findUnique({
    where: { id: moduleId },
    select: { id: true, type: true, formationId: true },
  })
  if (!module) return { error: 'Module introuvable.' }
  if (module.type !== 'ASSESSMENT') {
    return { error: 'Seuls les modules de type évaluation peuvent avoir un examen.' }
  }

  const existing = await db.exam.findUnique({ where: { moduleId } })

  if (existing) {
    await db.exam.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        description: data.description ?? null,
        passingScore: data.passingScore,
        timeLimit: data.timeLimit ?? null,
        shuffleQuestions: data.shuffleQuestions ?? false,
      },
    })
  } else {
    await db.exam.create({
      data: {
        moduleId,
        title: data.title,
        description: data.description ?? null,
        passingScore: data.passingScore,
        timeLimit: data.timeLimit ?? null,
        shuffleQuestions: data.shuffleQuestions ?? false,
      },
    })
  }

  revalidatePath(`/admin/formations/${module.formationId}`)
  revalidatePath(`/admin/formations/${module.formationId}/modules/${moduleId}/exam`)
  return { success: true }
}

export async function deleteExam(moduleId: string) {
  await requireAdmin()
  const exam = await db.exam.findUnique({
    where: { moduleId },
    include: { module: { select: { formationId: true } } },
  })
  if (!exam) return { error: 'Examen introuvable.' }

  await db.exam.delete({ where: { id: exam.id } })
  revalidatePath(`/admin/formations/${exam.module.formationId}`)
  return { success: true }
}

// ═════════════════════════════════════════════════════════════════
// ADMIN — Question CRUD
// ═════════════════════════════════════════════════════════════════

export interface QuestionFormData {
  text: string
  type: QuestionType
  points: number
  // TRUE_FALSE only
  correctBoolean?: boolean
  // QCM only — array of { text, isCorrect }
  choices?: { text: string; isCorrect: boolean }[]
}

export async function addQuestion(examId: string, data: QuestionFormData) {
  await requireAdmin()

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { module: { select: { formationId: true, id: true } } },
  })
  if (!exam) return { error: 'Examen introuvable.' }

  // Validate per-type
  if (data.type === 'TRUE_FALSE' && typeof data.correctBoolean !== 'boolean') {
    return { error: 'Réponse correcte requise pour Vrai/Faux.' }
  }
  if (data.type === 'QCM') {
    if (!data.choices || data.choices.length < 2) {
      return { error: 'Au moins 2 choix sont requis pour un QCM.' }
    }
    if (!data.choices.some(c => c.isCorrect)) {
      return { error: 'Au moins un choix doit être marqué comme correct.' }
    }
  }

  // Auto-assign next orderIndex
  const last = await db.question.findFirst({
    where: { examId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  })
  const orderIndex = (last?.orderIndex ?? -1) + 1

  await db.question.create({
    data: {
      examId,
      text: data.text,
      type: data.type,
      points: data.points,
      orderIndex,
      correctAnswer:
        data.type === 'TRUE_FALSE' ? { correct: data.correctBoolean } : undefined,
      choices:
        data.type === 'QCM' && data.choices
          ? {
              create: data.choices.map((c, i) => ({
                text: c.text,
                isCorrect: c.isCorrect,
                orderIndex: i,
              })),
            }
          : undefined,
    },
  })

  revalidatePath(`/admin/formations/${exam.module.formationId}/modules/${exam.module.id}/exam`)
  return { success: true }
}

export async function updateQuestion(questionId: string, data: QuestionFormData) {
  await requireAdmin()

  const question = await db.question.findUnique({
    where: { id: questionId },
    include: { exam: { include: { module: { select: { formationId: true, id: true } } } } },
  })
  if (!question) return { error: 'Question introuvable.' }

  // Rebuild choices for QCM (simpler than diffing)
  if (data.type === 'QCM') {
    if (!data.choices || data.choices.length < 2) {
      return { error: 'Au moins 2 choix sont requis.' }
    }
    if (!data.choices.some(c => c.isCorrect)) {
      return { error: 'Au moins un choix doit être correct.' }
    }
    await db.choice.deleteMany({ where: { questionId } })
    await db.choice.createMany({
      data: data.choices.map((c, i) => ({
        questionId,
        text: c.text,
        isCorrect: c.isCorrect,
        orderIndex: i,
      })),
    })
  } else {
    // Clean up any stale choices when switching away from QCM
    await db.choice.deleteMany({ where: { questionId } })
  }

  await db.question.update({
    where: { id: questionId },
    data: {
      text: data.text,
      type: data.type,
      points: data.points,
      correctAnswer:
        data.type === 'TRUE_FALSE' ? { correct: data.correctBoolean ?? false } : null,
    },
  })

  revalidatePath(`/admin/formations/${question.exam.module.formationId}/modules/${question.exam.module.id}/exam`)
  return { success: true }
}

export async function deleteQuestion(questionId: string) {
  await requireAdmin()
  const question = await db.question.findUnique({
    where: { id: questionId },
    include: { exam: { include: { module: { select: { formationId: true, id: true } } } } },
  })
  if (!question) return
  await db.question.delete({ where: { id: questionId } })
  revalidatePath(`/admin/formations/${question.exam.module.formationId}/modules/${question.exam.module.id}/exam`)
}

export async function reorderQuestions(examId: string, orderedIds: string[]) {
  await requireAdmin()
  await Promise.all(
    orderedIds.map((id, index) =>
      db.question.update({ where: { id }, data: { orderIndex: index } })
    )
  )
  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { module: { select: { formationId: true, id: true } } },
  })
  if (exam) {
    revalidatePath(`/admin/formations/${exam.module.formationId}/modules/${exam.module.id}/exam`)
  }
  return { success: true }
}

// ═════════════════════════════════════════════════════════════════
// STUDENT — Take Exam
// ═════════════════════════════════════════════════════════════════

/**
 * Lightweight exam status for the module view (does NOT reveal questions).
 */
export async function getExamStatusForStudent(moduleId: string): Promise<{
  hasExam: boolean
  questionCount: number
  attemptStarted: boolean
  attemptSubmitted: boolean
  score: number | null
  passed: boolean | null
  needsGrading: boolean
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const exam = await db.exam.findUnique({
    where: { moduleId },
    include: { _count: { select: { questions: true } } },
  })
  if (!exam) return {
    hasExam: false,
    questionCount: 0,
    attemptStarted: false,
    attemptSubmitted: false,
    score: null,
    passed: null,
    needsGrading: false,
  }

  const attempt = await db.examAttempt.findUnique({
    where: { userId_examId: { userId, examId: exam.id } },
    select: { submittedAt: true, score: true, passed: true, needsGrading: true },
  })

  return {
    hasExam: true,
    questionCount: exam._count.questions,
    attemptStarted: !!attempt,
    attemptSubmitted: !!attempt?.submittedAt,
    score: attempt?.score ?? null,
    passed: attempt?.passed ?? null,
    needsGrading: attempt?.needsGrading ?? false,
  }
}

/**
 * Fetch exam for student WITHOUT correct answers / isCorrect flags.
 */
export async function getExamForStudent(moduleId: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const moduleEnrollment = await db.moduleEnrollment.findFirst({
    where: { userId, moduleId },
  })
  if (!moduleEnrollment) return null

  const exam = await db.exam.findUnique({
    where: { moduleId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          text: true,
          type: true,
          points: true,
          orderIndex: true,
          choices: {
            orderBy: { orderIndex: 'asc' },
            select: { id: true, text: true, orderIndex: true },
          },
        },
      },
      module: { select: { id: true, title: true, formationId: true } },
    },
  })
  if (!exam) return null

  // Check for existing attempt (one-shot policy)
  const attempt = await db.examAttempt.findUnique({
    where: { userId_examId: { userId: userId, examId: exam.id } },
  })

  return { exam, attempt, moduleEnrollmentId: moduleEnrollment.id }
}

/**
 * Create an ExamAttempt record. One-shot: fails if attempt exists.
 */
export async function startExamAttempt(moduleId: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const data = await getExamForStudent(moduleId)
  if (!data) return { error: 'Examen introuvable.' }

  if (data.attempt) {
    return { error: 'Vous avez déjà passé cet examen.', attemptId: data.attempt.id }
  }

  const attempt = await db.examAttempt.create({
    data: {
      userId,
      examId: data.exam.id,
      moduleEnrollmentId: data.moduleEnrollmentId,
      startedAt: new Date(),
    },
  })

  return { success: true, attemptId: attempt.id }
}

interface SubmittedAnswer {
  questionId: string
  // QCM: choiceId, TRUE_FALSE: boolean (as 'true'/'false' string), OPEN: text
  value: string | boolean
}

/**
 * Submit the exam: auto-grade QCM + TRUE_FALSE, queue OPEN for trainer review.
 */
export async function submitExamAttempt(attemptId: string, answers: SubmittedAnswer[]) {
  const session = await requireAuth()
  const userId = session.user.id

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { name: true } },
      exam: {
        include: {
          questions: { include: { choices: true } },
          module: {
            select: {
              title: true,
              formationId: true,
              formation: { select: { title: true } },
            },
          },
        },
      },
      moduleEnrollment: { select: { id: true, formationEnrollmentId: true } },
    },
  })
  if (!attempt) return { error: 'Tentative introuvable.' }
  if (attempt.userId !== userId) return { error: 'Non autorisé.' }
  if (attempt.submittedAt) return { error: 'Tentative déjà soumise.' }

  const answerByQ = new Map(answers.map(a => [a.questionId, a.value]))

  let earnedPoints = 0
  let totalPoints = 0
  let hasOpenQuestions = false

  for (const q of attempt.exam.questions) {
    totalPoints += q.points
    const value = answerByQ.get(q.id)

    if (q.type === 'QCM') {
      const selectedChoiceId = typeof value === 'string' ? value : null
      const chosen = q.choices.find(c => c.id === selectedChoiceId)
      const isCorrect = !!chosen?.isCorrect
      const points = isCorrect ? q.points : 0
      earnedPoints += points
      await db.answerSubmission.create({
        data: {
          attemptId,
          questionId: q.id,
          answer: { choiceId: selectedChoiceId },
          isCorrect,
          pointsAwarded: points,
        },
      })
    } else if (q.type === 'TRUE_FALSE') {
      // client sends "true"/"false" as string (HTML form), or boolean
      const boolVal =
        typeof value === 'boolean'
          ? value
          : value === 'true'
      const correct = (q.correctAnswer as { correct: boolean } | null)?.correct ?? false
      const isCorrect = boolVal === correct
      const points = isCorrect ? q.points : 0
      earnedPoints += points
      await db.answerSubmission.create({
        data: {
          attemptId,
          questionId: q.id,
          answer: { value: boolVal },
          isCorrect,
          pointsAwarded: points,
        },
      })
    } else {
      // OPEN — manual grading
      hasOpenQuestions = true
      await db.answerSubmission.create({
        data: {
          attemptId,
          questionId: q.id,
          answer: { text: typeof value === 'string' ? value : '' },
          // pointsAwarded + isCorrect left null until trainer grades
        },
      })
    }
  }

  // If no OPEN questions → finalize immediately
  if (!hasOpenQuestions) {
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= attempt.exam.passingScore

    await db.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        score,
        passed,
        needsGrading: false,
      },
    })

    // Mark module enrollment as completed (log result regardless of pass/fail)
    await completeAssessmentModule(attempt.moduleEnrollment.id, attempt.moduleEnrollment.formationEnrollmentId)

    revalidatePath(`/student/formations`)
    return { success: true, score, passed, needsGrading: false }
  }

  // Has OPEN questions → queue for grading
  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      needsGrading: true,
    },
  })

  // Still mark module as attempted (completedAt) per "just log" policy
  await completeAssessmentModule(attempt.moduleEnrollment.id, attempt.moduleEnrollment.formationEnrollmentId)

  // Notify trainer (or admin fallback) that open answers need grading
  try {
    const formationId = attempt.exam.module.formationId
    const gradingUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/grading`

    const trainerSession = await db.session.findFirst({
      where: { formationId, trainerId: { not: null } },
      include: { trainer: { include: { user: { select: { name: true, email: true } } } } },
    })

    const recipients: { name: string; email: string }[] = []
    if (trainerSession?.trainer?.user?.email) {
      recipients.push({
        name: trainerSession.trainer.user.name ?? 'Formateur',
        email: trainerSession.trainer.user.email,
      })
    } else {
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { name: true, email: true },
      })
      recipients.push(...admins.map(a => ({ name: a.name, email: a.email })))
    }

    for (const r of recipients) {
      await sendGradingNotificationEmail({
        to: r.email,
        trainerName: r.name,
        studentName: attempt.user?.name ?? 'Apprenant',
        formationTitle: attempt.exam.module.formation.title,
        moduleName: attempt.exam.module.title,
        gradingUrl,
      })
    }
  } catch (err) {
    console.error('[submitExamAttempt] Grading notification failed:', err)
  }

  revalidatePath(`/student/formations`)
  return { success: true, score: null, passed: null, needsGrading: true }
}

/**
 * Shared helper: mark an ASSESSMENT module complete and recompute formation progress.
 * Called after exam submit (pass/fail doesn't matter — policy is "just log").
 */
async function completeAssessmentModule(
  moduleEnrollmentId: string,
  formationEnrollmentId: string
) {
  await db.moduleEnrollment.update({
    where: { id: moduleEnrollmentId },
    data: { completedAt: new Date(), status: 'COMPLETED', progress: 100 },
  })

  const [totalModules, completedModules] = await Promise.all([
    db.moduleEnrollment.count({ where: { formationEnrollmentId } }),
    db.moduleEnrollment.count({
      where: { formationEnrollmentId, completedAt: { not: null } },
    }),
  ])

  const newProgress = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0

  await db.formationEnrollment.update({
    where: { id: formationEnrollmentId },
    data: {
      progress: newProgress,
      completedAt: newProgress === 100 ? new Date() : undefined,
    },
  })
}

/**
 * Student-facing result view (only shown AFTER submit).
 */
export async function getAttemptResult(attemptId: string) {
  const session = await requireAuth()
  const userId = session.user.id

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: { choices: { orderBy: { orderIndex: 'asc' } } },
          },
          module: { select: { id: true, title: true, formationId: true } },
        },
      },
      answers: true,
    },
  })
  if (!attempt) return null
  if (attempt.userId !== userId && session.user.role !== 'ADMIN') return null
  return attempt
}

// ═════════════════════════════════════════════════════════════════
// TRAINER — Grading Queue
// ═════════════════════════════════════════════════════════════════

export async function getAttemptsNeedingGrading() {
  await requireTrainerOrAdmin()

  return db.examAttempt.findMany({
    where: { needsGrading: true, submittedAt: { not: null } },
    orderBy: { submittedAt: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      exam: {
        include: {
          module: {
            select: {
              id: true,
              title: true,
              formation: { select: { id: true, title: true } },
            },
          },
        },
      },
    },
  })
}

export async function getAttemptForGrading(attemptId: string) {
  await requireTrainerOrAdmin()

  return db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      exam: {
        include: {
          questions: {
            orderBy: { orderIndex: 'asc' },
            include: { choices: { orderBy: { orderIndex: 'asc' } } },
          },
          module: {
            select: {
              id: true,
              title: true,
              formation: { select: { id: true, title: true } },
            },
          },
        },
      },
      answers: true,
    },
  })
}

interface OpenGrade {
  answerId: string
  pointsAwarded: number
  graderNote?: string
}

export async function gradeOpenAnswers(attemptId: string, grades: OpenGrade[]) {
  const session = await requireTrainerOrAdmin()

  const attempt = await db.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: { include: { questions: true } },
      answers: true,
    },
  })
  if (!attempt) return { error: 'Tentative introuvable.' }

  // Apply grader input
  for (const g of grades) {
    const answer = attempt.answers.find(a => a.id === g.answerId)
    if (!answer) continue
    const question = attempt.exam.questions.find(q => q.id === answer.questionId)
    if (!question) continue

    const clamped = Math.max(0, Math.min(g.pointsAwarded, question.points))
    await db.answerSubmission.update({
      where: { id: g.answerId },
      data: {
        pointsAwarded: clamped,
        isCorrect: clamped >= question.points,
        graderNote: g.graderNote ?? null,
      },
    })
  }

  // Recompute totals
  const refreshed = await db.answerSubmission.findMany({ where: { attemptId } })
  const earnedPoints = refreshed.reduce((sum, a) => sum + (a.pointsAwarded ?? 0), 0)
  const totalPoints = attempt.exam.questions.reduce((sum, q) => sum + q.points, 0)
  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  const passed = score >= attempt.exam.passingScore

  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      passed,
      needsGrading: false,
      gradedAt: new Date(),
      gradedBy: session.user.id,
    },
  })

  revalidatePath('/trainer/grading')
  return { success: true, score, passed }
}
