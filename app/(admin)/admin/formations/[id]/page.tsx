import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFormation } from '@/app/actions/formations'
import { getModulesForFormation, getModuleFormData } from '@/app/actions/modules'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import ModulesList from './_components/modules-list'

export const metadata = { title: 'Gestion des modules' }

const statusLabel: Record<string, string> = {
  DRAFT: 'Brouillon',
  PUBLISHED: 'Publiée',
  ARCHIVED: 'Archivée',
  COMPLETED: 'Terminée',
}

const statusDot: Record<string, string> = {
  DRAFT: 'bg-amber-400',
  PUBLISHED: 'bg-emerald-500',
  ARCHIVED: 'bg-muted-foreground',
  COMPLETED: 'bg-blue-500',
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(d))
}

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [formation, modules, { trainers }] = await Promise.all([
    getFormation(id),
    getModulesForFormation(id),
    getModuleFormData(),
  ])

  if (!formation) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/formations" className="group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground size-8 mt-0.5">
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{formation.title}</h1>
            <span className="inline-flex items-center gap-1.5 text-sm">
              <span className={`h-2 w-2 rounded-full shrink-0 ${statusDot[formation.status]}`} />
              <span className="text-muted-foreground">{statusLabel[formation.status]}</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {formation.description}
          </p>
        </div>

        <div className="shrink-0 flex gap-2 items-center text-sm text-muted-foreground">
          <Badge variant="secondary">{formation.category.name}</Badge>
          <span>{formatDate(formation.startDate)} → {formatDate(formation.endDate)}</span>
        </div>
      </div>

      {/* Modules section */}
      <ModulesList
        formationId={id}
        initialModules={modules}
        trainers={trainers}
      />
    </div>
  )
}
