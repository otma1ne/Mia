import type { Metadata } from 'next'
import { getFormations, getFormationFormData } from '@/app/actions/formations'
import FormationsClient from './_components/formations-client'
import type { FormationStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Formations — MIA Académie' }

const VALID_STATUSES = new Set<FormationStatus>(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'COMPLETED'])

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; categoryId?: string }>
}

export default async function FormationsPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '', status: statusParam, categoryId } = await searchParams

  const page   = Math.max(1, Number(pageParam) || 1)
  const status = VALID_STATUSES.has(statusParam as FormationStatus)
    ? (statusParam as FormationStatus)
    : undefined

  const [data, categories] = await Promise.all([
    getFormations({ page, search, status, categoryId }),
    getFormationFormData(),
  ])

  const activeTab = status ?? 'all'

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <FormationsClient
        data={data}
        search={search}
        activeTab={activeTab as 'all' | FormationStatus}
        categories={categories}
        activeCategoryId={categoryId ?? null}
      />
    </div>
  )
}
