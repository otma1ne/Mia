import type { Metadata } from 'next'
import { getStudentEnrollments } from '@/app/actions/student-dashboard'
import StudentEnrollmentsClient from './_components/student-enrollments-client'
import type { EnrollmentStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Mes inscriptions — EduDrive' }

const VALID_STATUSES: EnrollmentStatus[] = ['ACTIVE', 'COMPLETED', 'DROPPED', 'SUSPENDED']

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const { search = '', status, page } = await searchParams

  const parsedStatus = VALID_STATUSES.includes(status as EnrollmentStatus)
    ? (status as EnrollmentStatus)
    : undefined

  const data = await getStudentEnrollments({
    search,
    status: parsedStatus,
    page: page ? Math.max(1, Number(page)) : 1,
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Mes inscriptions</h1>
        <p className="text-sm text-muted-foreground">Suivez vos cours, votre progression et votre statut de complétion.</p>
      </div>
      <StudentEnrollmentsClient data={data} search={search} activeTab={parsedStatus ?? 'all'} />
    </div>
  )
}
