import type { Metadata } from 'next'
import { startOfWeek, endOfWeek } from 'date-fns'
import { getTrainerSessions } from '@/app/actions/trainer-dashboard'
import TrainerScheduleClient from './_components/trainer-schedule-client'

export const metadata: Metadata = { title: 'Planning — EduDrive' }

export default async function TrainerSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; view?: string }>
}) {
  const { ref, view } = await searchParams

  const refDate  = ref ? new Date(ref) : new Date()
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(refDate, { weekStartsOn: 1 })

  const sessions = await getTrainerSessions({ from: weekStart, to: weekEnd })

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Mon planning</h1>
        <p className="text-sm text-muted-foreground">Consultez vos prochaines séances et votre emploi du temps.</p>
      </div>
      <TrainerScheduleClient
        initialSessions={sessions}
        refDateStr={refDate.toISOString()}
        view={(view === 'list' ? 'list' : 'week') as 'week' | 'list'}
      />
    </div>
  )
}
