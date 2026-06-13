import type { Metadata } from 'next'
import Link from 'next/link'
import { ClipboardCheck, ChevronRight, User, BookOpen } from 'lucide-react'
import { getAttemptsNeedingGrading } from '@/app/actions/exams'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata: Metadata = { title: 'Corrections en attente — Formateur' }

export default async function TrainerGradingPage() {
  const attempts = await getAttemptsNeedingGrading()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-6 w-6 text-purple-600" />
        <div>
          <h1 className="text-xl font-semibold">Corrections en attente</h1>
          <p className="text-sm text-muted-foreground">
            {attempts.length} examen{attempts.length !== 1 ? 's' : ''} à corriger
          </p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Aucun examen en attente de correction.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {attempts.map(a => (
            <Link
              key={a.id}
              href={`/trainer/grading/${a.id}`}
              className="block"
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {a.exam.module.formation.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <BookOpen className="h-3 w-3" />
                        {a.exam.module.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {a.user.name} · {a.user.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">
                        Soumis le
                      </p>
                      <p className="text-xs font-medium">
                        {a.submittedAt && format(new Date(a.submittedAt), 'd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
