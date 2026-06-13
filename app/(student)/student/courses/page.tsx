import type { Metadata } from 'next'
import { getStudentBrowsableFormations } from '@/app/actions/student-dashboard'
import StudentCoursesClient from './_components/student-courses-client'
import type { FormationType } from '@prisma/client'

export const metadata: Metadata = { title: 'Formations — EduDrive' }

const VALID_TYPES: FormationType[] = ['PRESENTIAL', 'REMOTE_LIVE', 'REMOTE_ASYNC']

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; page?: string }>
}) {
  const { search = '', type, page } = await searchParams

  const parsedType = VALID_TYPES.includes(type as FormationType)
    ? (type as FormationType)
    : undefined

  const data = await getStudentBrowsableFormations({
    search,
    type: parsedType,
    page: page ? Math.max(1, Number(page)) : 1,
  })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Catalogue de formations</h1>
        <p className="text-sm text-muted-foreground">Explorez les formations disponibles et inscrivez-vous pour commencer à apprendre.</p>
      </div>
      <StudentCoursesClient
        data={data}
        search={search}
        activeType={parsedType ?? null}
      />
    </div>
  )
}
