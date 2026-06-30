import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getExamForStudent } from '@/app/actions/exams'
import ExamTaking from './_components/exam-taking'

export const metadata: Metadata = { title: 'Examen en cours — MIA Académie' }

interface Props {
  params: Promise<{ id: string; moduleId: string }>
}

export default async function ExamTakePage({ params }: Props) {
  const { id: formationId, moduleId } = await params
  const data = await getExamForStudent(moduleId)
  if (!data) notFound()

  const { exam, attempt } = data

  // Must have started attempt
  if (!attempt) {
    redirect(`/student/formations/${formationId}/modules/${moduleId}/exam`)
  }

  // Already submitted → result
  if (attempt.submittedAt) {
    redirect(`/student/formations/${formationId}/modules/${moduleId}/exam/result`)
  }

  return (
    <ExamTaking
      attemptId={attempt.id}
      examTitle={exam.title}
      moduleTitle={exam.module.title}
      formationId={formationId}
      moduleId={moduleId}
      timeLimit={exam.timeLimit}
      startedAt={attempt.startedAt.toISOString()}
      shuffle={exam.shuffleQuestions}
      questions={exam.questions.map(q => ({
        id: q.id,
        text: q.text,
        type: q.type,
        points: q.points,
        choices: q.choices.map(c => ({ id: c.id, text: c.text })),
      }))}
    />
  )
}
