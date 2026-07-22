import type { Metadata } from 'next'
import { format } from 'date-fns'
import { getSessions, getScheduleFormData } from '@/app/actions/schedule'
import { getWeekRange } from '@/lib/schedule-utils'
import ScheduleClient from './_components/schedule-client'

export const metadata: Metadata = { title: 'Planification — MIA Académie' }

interface PageProps {
  searchParams: Promise<{ ref?: string; view?: string }>
}

export default async function SchedulePage({ searchParams }: PageProps) {
  const { ref, view: viewParam } = await searchParams

  const refDate = ref ? new Date(ref) : new Date()
  const view    = viewParam === 'list' ? 'list' : 'week'

  const { from, to } = getWeekRange(refDate)

  const [sessions, formData] = await Promise.all([
    getSessions({ from, to }),
    getScheduleFormData(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <ScheduleClient
        initialSessions={sessions}
        refDateStr={format(refDate, 'yyyy-MM-dd')}
        view={view}
        modules={formData.modules}
        rooms={formData.rooms}
        trainers={formData.trainers}
      />
    </div>
  )
}
