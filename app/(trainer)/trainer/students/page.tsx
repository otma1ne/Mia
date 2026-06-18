import type { Metadata } from 'next'
import { getTrainerStudents } from '@/app/actions/trainer-dashboard'
import TrainerStudentsClient from './_components/trainer-students-client'

export const metadata: Metadata = { title: 'Étudiants — MIA Formation' }

export default async function TrainerStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const { search = '', page } = await searchParams

  const data = await getTrainerStudents({
    search,
    page: page ? Math.max(1, Number(page)) : 1,
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Étudiants</h1>
        <p className="text-sm text-muted-foreground">Étudiants inscrits dans vos cours.</p>
      </div>
      <TrainerStudentsClient data={data} search={search} />
    </div>
  )
}
