import type { Metadata } from 'next'
import { getTrainers, getTrainerFormCategories } from '@/app/actions/trainers'
import { getTrainerApplications, getPendingApplicationsCount } from '@/app/actions/trainer-applications'
import TrainersClient from './_components/trainers-client'
import TrainerApplicationsTab from './_components/trainer-applications-tab'

export const metadata: Metadata = { title: 'Formateurs — MIA Académie' }

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; tab?: string }>
}

export default async function TrainersPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '', tab = 'formateurs' } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [data, categories, applications, pendingCount] = await Promise.all([
    getTrainers({ page, search }),
    getTrainerFormCategories(),
    getTrainerApplications(),
    getPendingApplicationsCount(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b pb-0">
        {[
          { value: 'formateurs',   label: 'Formateurs' },
          { value: 'candidatures', label: 'Candidatures', badge: pendingCount },
        ].map(t => (
          <a
            key={t.value}
            href={`?tab=${t.value}`}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
                {t.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {tab === 'candidatures' ? (
        <TrainerApplicationsTab applications={applications} />
      ) : (
        <TrainersClient data={data} search={search} categories={categories} />
      )}
    </div>
  )
}
