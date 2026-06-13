import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ClipboardCheck } from 'lucide-react'
import { getExamForAdmin } from '@/app/actions/exams'
import { getModule } from '@/app/actions/modules'
import ExamBuilder from './_components/exam-builder'

export const metadata = { title: 'Gestion de l\'examen' }

export default async function ExamManagementPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>
}) {
  const { id: formationId, moduleId } = await params

  const [module, exam] = await Promise.all([
    getModule(moduleId),
    getExamForAdmin(moduleId),
  ])

  if (!module) notFound()
  if (module.type !== 'ASSESSMENT') {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6 max-w-2xl">
        <Link
          href={`/admin/formations/${formationId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground self-start"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour à la formation
        </Link>
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Ce module n&apos;est pas de type évaluation.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/admin/formations/${formationId}`}
          className="group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground size-8 mt-0.5"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ClipboardCheck className="h-5 w-5 text-purple-600 shrink-0" />
            <h1 className="text-xl font-semibold truncate">Examen — {module.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {module.formation.title}
          </p>
        </div>
      </div>

      <ExamBuilder
        moduleId={moduleId}
        exam={exam}
      />
    </div>
  )
}
