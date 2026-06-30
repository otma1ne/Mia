import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getFormationDetail } from '@/app/actions/student-dashboard'
import { getEvaluationState, type EvaluationAnswers } from '@/app/actions/evaluation'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChevronLeft, ClipboardCheck, CheckCircle2, Star,
  ThumbsUp, ThumbsDown, BookOpen, MessageSquare,
} from 'lucide-react'
import EvaluationForm from './_components/evaluation-form'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Évaluation finale — MIA Académie' }

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  )
}

function EvaluationSummary({
  answers,
  submittedAt,
}: {
  answers: EvaluationAnswers
  submittedAt: Date
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 className="h-5 w-5" />
        <span className="text-sm font-medium">
          Évaluation soumise le {format(new Date(submittedAt), 'dd MMMM yyyy', { locale: fr })}
        </span>
      </div>

      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Vos notes
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Satisfaction globale', value: answers.overallRating },
            { label: 'Qualité du contenu', value: answers.contentRating },
            { label: 'Qualité du formateur', value: answers.trainerRating },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <StarDisplay value={value} />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1 border-t">
          {answers.wouldRecommend ? (
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
          ) : (
            <ThumbsDown className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm">
            {answers.wouldRecommend
              ? 'Vous recommandez cette formation'
              : 'Vous ne recommandez pas cette formation'}
          </span>
        </div>

        {answers.bestLearning && (
          <div className="flex flex-col gap-1 pt-1 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <BookOpen className="h-3.5 w-3.5" />
              Ce que vous avez retenu
            </div>
            <p className="text-sm">{answers.bestLearning}</p>
          </div>
        )}

        {answers.suggestions && (
          <div className="flex flex-col gap-1 pt-1 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MessageSquare className="h-3.5 w-3.5" />
              Suggestions
            </div>
            <p className="text-sm">{answers.suggestions}</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function EvaluationPage({ params }: Props) {
  const { id: formationId } = await params
  const [formation, evalState] = await Promise.all([
    getFormationDetail(formationId),
    getEvaluationState(formationId),
  ])

  if (!formation) notFound()
  if (!formation.allModulesCompleted) redirect(`/student/formations/${formationId}`)

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-2xl mx-auto w-full">
      {/* Back */}
      <Link
        href={`/student/formations/${formationId}`}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 h-7 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground self-start -ml-2 text-muted-foreground"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        {formation.title}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Évaluation finale</h1>
        <p className="text-sm text-muted-foreground">{formation.title}</p>
      </div>

      {/* Completion banner */}
      <Card>
        <CardContent className="py-5 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold">Parcours terminé !</p>
            <p className="text-sm text-muted-foreground">
              {formation.modules.length} module{formation.modules.length !== 1 ? 's' : ''} complété{formation.modules.length !== 1 ? 's' : ''}.
              Partagez votre retour pour nous aider à améliorer la formation.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation section */}
      <Card>
        <CardContent className="py-5 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Questionnaire de satisfaction</p>
              <p className="text-sm text-muted-foreground">
                Anonyme · 2 minutes
              </p>
            </div>
          </div>

          {evalState?.submitted && evalState.answers ? (
            <EvaluationSummary
              answers={evalState.answers}
              submittedAt={evalState.submittedAt!}
            />
          ) : (
            <EvaluationForm formationId={formationId} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
