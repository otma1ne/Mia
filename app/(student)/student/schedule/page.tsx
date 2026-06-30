import type { Metadata } from 'next'
import { startOfWeek, endOfWeek } from 'date-fns'
import { getStudentSessions } from '@/app/actions/student-dashboard'
import StudentScheduleClient from './_components/student-schedule-client'

export const metadata: Metadata = { title: 'Planning — MIA Académie' }

export default async function StudentSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; view?: string }>
}) {
  const { ref, view } = await searchParams

  const refDate   = ref ? new Date(ref) : new Date()
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(refDate, { weekStartsOn: 1 })

  const sessions = await getStudentSessions({ from: weekStart, to: weekEnd })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Mon planning</h1>
        <p className="text-sm text-muted-foreground">Consultez vos prochains cours et votre emploi du temps.</p>
      </div>
      <StudentScheduleClient
        initialSessions={sessions}
        refDateStr={refDate.toISOString()}
        view={(view === 'list' ? 'list' : 'week') as 'week' | 'list'}
      />
    </div>
  )
}
