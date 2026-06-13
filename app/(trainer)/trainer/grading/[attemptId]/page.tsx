import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { getAttemptForGrading } from '@/app/actions/exams'
import GradingForm from './_components/grading-form'

export const metadata: Metadata = { title: 'Correction — Formateur' }

interface Props {
  params: Promise<{ attemptId: string }>
}

export default async function GradeAttemptPage({ params }: Props) {
  const { attemptId } = await params
  const attempt = await getAttemptForGrading(attemptId)
  if (!attempt) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl">
      <Link
        href="/trainer/grading"
        className="inline-flex items-center gap-1 rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground self-start -ml-2 text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Retour aux corrections
      </Link>

      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-purple-600" />
        <div>
          <h1 className="text-xl font-semibold">Correction — {attempt.exam.module.title}</h1>
          <p className="text-sm text-muted-foreground">
            {attempt.exam.module.formation.title} · Étudiant : {attempt.user.name}
          </p>
        </div>
      </div>

      <GradingForm
        attemptId={attempt.id}
        exam={{
          title: attempt.exam.title,
          passingScore: attempt.exam.passingScore,
        }}
        questions={attempt.exam.questions.map(q => {
          const answer = attempt.answers.find(a => a.questionId === q.id)
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            points: q.points,
            choices: q.choices.map(c => ({ id: c.id, text: c.text, isCorrect: c.isCorrect })),
            correctAnswer: q.correctAnswer,
            answer: answer
              ? {
                  id: answer.id,
                  value: answer.answer,
                  pointsAwarded: answer.pointsAwarded,
                  isCorrect: answer.isCorrect,
                  graderNote: answer.graderNote,
                }
              : null,
          }
        })}
      />
    </div>
  )
}
