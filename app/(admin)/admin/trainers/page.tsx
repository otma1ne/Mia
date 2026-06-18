import type { Metadata } from 'next'
import { getTrainers } from '@/app/actions/trainers'
import TrainersClient from './_components/trainers-client'

export const metadata: Metadata = { title: 'Formateurs — MIA Formation' }

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function TrainersPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '' } = await searchParams

  const page = Math.max(1, Number(pageParam) || 1)

  const data = await getTrainers({ page, search })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <TrainersClient data={data} search={search} />
    </div>
  )
}
