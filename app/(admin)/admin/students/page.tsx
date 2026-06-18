import type { Metadata } from 'next'
import { getStudents } from '@/app/actions/students'
import StudentsClient from './_components/students-client'

export const metadata: Metadata = { title: 'Étudiants — MIA Formation' }

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function StudentsPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '' } = await searchParams

  const page = Math.max(1, Number(pageParam) || 1)

  const data = await getStudents({ page, search })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <StudentsClient data={data} search={search} />
    </div>
  )
}
