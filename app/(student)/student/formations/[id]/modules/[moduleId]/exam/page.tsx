import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { getExamForStudent } from '@/app/actions/exams'
import StartExamButton from './_components/start-exam-button'

export const metadata: Metadata = { title: 'Examen — MIA Formation' }

interface Props {
  params: Promise<{ id: string; moduleId: string }>
}

export default async function StudentExamPage({ params }: Props) {
  const { id: formationId, moduleId } = await params
  const data = await getExamForStudent(moduleId)
  if (!data) notFound()

  const { exam, attempt } = data

  // If attempt submitted → show result
  if (attempt?.submittedAt) {
    redirect(`/student/formations/${formationId}/modules/${moduleId}/exam/result`)
  }

  // If attempt started but not submitted → resume (take page)
  if (attempt && !attempt.submittedAt) {
    redirect(`/student/formations/${formationId}/modules/${moduleId}/exam/take`)
  }

  // No attempt yet → show intro
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-2xl mx-auto w-full">
      <Link
        href={`/student/formations/${formationId}/modules/${moduleId}`}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground self-start -ml-2 text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Retour au module
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
          <ClipboardCheck className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">{exam.module.title}</p>
        </div>
      </div>

      {exam.description && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground whitespace-pre-wrap">
            {exam.description}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="py-5 space-y-3">
          <h2 className="text-sm font-semibold">Informations</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {exam.questions.length} question{exam.questions.length !== 1 ? 's' : ''} ·{' '}
                Note de passage : {exam.passingScore}%
              </span>
            </li>
            {exam.timeLimit && (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Durée : {exam.timeLimit} minutes</span>
              </li>
            )}
            <li className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-amber-700 dark:text-amber-400">
                Attention : <strong>tentative unique</strong>. Une fois soumis, vous ne pourrez pas recommencer.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {exam.questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Cet examen ne contient pas encore de questions.
          </CardContent>
        </Card>
      ) : (
        <StartExamButton moduleId={moduleId} formationId={formationId} />
      )}
    </div>
  )
}
