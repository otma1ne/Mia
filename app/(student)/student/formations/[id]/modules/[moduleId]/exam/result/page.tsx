import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, CheckCircle2, XCircle, Clock, ClipboardCheck,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getExamForStudent, getAttemptResult } from '@/app/actions/exams'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Résultat de l\'examen — MIA Formation' }

interface Props {
  params: Promise<{ id: string; moduleId: string }>
}

export default async function ExamResultPage({ params }: Props) {
  const { id: formationId, moduleId } = await params

  const examData = await getExamForStudent(moduleId)
  if (!examData?.attempt) {
    redirect(`/student/formations/${formationId}/modules/${moduleId}/exam`)
  }
  if (!examData.attempt.submittedAt) {
    redirect(`/student/formations/${formationId}/modules/${moduleId}/exam/take`)
  }

  const attempt = await getAttemptResult(examData.attempt.id)
  if (!attempt) notFound()

  const { exam, answers } = attempt
  const needsGrading = attempt.needsGrading

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl mx-auto w-full">
      <Link
        href={`/student/formations/${formationId}/modules/${moduleId}`}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground self-start -ml-2 text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Retour au module
      </Link>

      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-purple-600 shrink-0" />
        <div>
          <h1 className="text-xl font-semibold">Résultat — {exam.title}</h1>
          <p className="text-sm text-muted-foreground">{exam.module.title}</p>
        </div>
      </div>

      {/* Score card */}
      {needsGrading ? (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">Examen soumis</p>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Votre examen contient des questions ouvertes qui doivent être corrigées par un formateur.
                Vous recevrez votre résultat final une fois la correction terminée.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              attempt.passed ? 'bg-emerald-100' : 'bg-red-100'
            )}>
              {attempt.passed
                ? <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                : <XCircle className="h-8 w-8 text-red-600" />}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {attempt.passed ? 'Réussi !' : 'Non réussi'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Score : <span className="font-bold tabular-nums">{attempt.score}%</span>
                {' · '}
                Note de passage : {exam.passingScore}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-question breakdown (only shown if auto-graded) */}
      {!needsGrading && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Détail des réponses
          </h2>
          {exam.questions.map((q, idx) => {
            const ans = answers.find(a => a.questionId === q.id)
            return (
              <Card key={q.id}>
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {ans?.isCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <span className="text-muted-foreground mr-1.5">#{idx + 1}</span>
                        {q.text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ans?.pointsAwarded ?? 0} / {q.points} pt{q.points !== 1 ? 's' : ''}
                      </p>
                      {q.type === 'QCM' && (
                        <ul className="mt-2 space-y-1 text-xs">
                          {q.choices.map(c => {
                            const isSelected =
                              (ans?.answer as { choiceId?: string } | null)?.choiceId === c.id
                            return (
                              <li
                                key={c.id}
                                className={cn(
                                  'flex items-center gap-1.5 rounded px-2 py-1',
                                  c.isCorrect && 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
                                  isSelected && !c.isCorrect && 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                                )}
                              >
                                {c.isCorrect && <CheckCircle2 className="h-3 w-3" />}
                                {isSelected && !c.isCorrect && <XCircle className="h-3 w-3" />}
                                <span>{c.text}</span>
                                {isSelected && <span className="ml-auto text-muted-foreground">(votre choix)</span>}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                      {q.type === 'TRUE_FALSE' && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Votre réponse :{' '}
                          <span className="font-medium">
                            {(ans?.answer as { value?: boolean } | null)?.value ? 'Vrai' : 'Faux'}
                          </span>
                          {' · Correcte : '}
                          <span className="font-medium text-emerald-700 dark:text-emerald-500">
                            {(q.correctAnswer as { correct: boolean } | null)?.correct ? 'Vrai' : 'Faux'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
