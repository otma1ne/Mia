import type { Metadata } from 'next'
import { getTrainerModules } from '@/app/actions/trainer-dashboard'
import TrainerModulesClient from './_components/trainer-modules-client'
import type { ModuleStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Mes modules — Auto-école' }

const VALID_STATUSES: ModuleStatus[] = ['PUBLISHED', 'DRAFT', 'COMPLETED', 'ARCHIVED']

export default async function TrainerModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const { search = '', status, page } = await searchParams

  const parsedStatus = VALID_STATUSES.includes(status as ModuleStatus)
    ? (status as ModuleStatus)
    : undefined

  const data = await getTrainerModules({
    search,
    status: parsedStatus,
    page: page ? Math.max(1, Number(page)) : 1,
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Mes modules</h1>
        <p className="text-sm text-muted-foreground">Consultez et gérez vos modules assignés.</p>
      </div>
      <TrainerModulesClient
        data={data}
        search={search}
        activeTab={parsedStatus ?? 'all'}
      />
    </div>
  )
}
