import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getFormationDetail } from '@/app/actions/student-dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ClipboardCheck, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Évaluation finale — Auto-école' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EvaluationPage({ params }: Props) {
  const { id: formationId } = await params
  const formation = await getFormationDetail(formationId)

  if (!formation) notFound()

  // Gate: all modules must be completed
  if (!formation.allModulesCompleted) {
    redirect(`/student/formations/${formationId}`)
  }

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

      {/* Completion confirmation */}
      <Card>
        <CardContent className="py-6 flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-lg">Parcours terminé !</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Vous avez complété tous les modules de cette formation.
              Vous pouvez maintenant passer l&apos;évaluation finale.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4" />
              {formation.modules.length} module{formation.modules.length !== 1 ? 's' : ''} terminé{formation.modules.length !== 1 ? 's' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation placeholder */}
      <Card>
        <CardContent className="py-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Questionnaire d&apos;évaluation</p>
              <p className="text-sm text-muted-foreground">
                Répondez aux questions pour valider votre formation.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-muted-foreground/30 p-8 flex flex-col items-center gap-2 text-center">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              L&apos;évaluation sera disponible prochainement.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Votre moniteur vous contactera pour organiser l&apos;examen final.
            </p>
          </div>

          <Link
            href={`/student/formations/${formationId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground self-start"
          >
            Retour à la formation
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
