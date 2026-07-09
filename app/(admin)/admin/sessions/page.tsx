import type { Metadata } from 'next'
import { getTrainingSessions, getTrainingSessionCounts } from '@/app/actions/training-sessions'
import SessionsClient from './_components/sessions-client'
import type { TrainingSessionStatus } from '@prisma/client'

export const metadata: Metadata = { title: 'Sessions — MIA Académie' }

const VALID_STATUSES = new Set<TrainingSessionStatus>(['DRAFT', 'OPEN', 'STARTED', 'COMPLETED', 'CANCELLED'])

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>
}

export default async function SessionsPage({ searchParams }: PageProps) {
  const { search = '', status: statusParam } = await searchParams

  const status = VALID_STATUSES.has(statusParam as TrainingSessionStatus)
    ? (statusParam as TrainingSessionStatus)
    : undefined

  const [sessions, counts] = await Promise.all([
    getTrainingSessions({ search, status }),
    getTrainingSessionCounts(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <SessionsClient
        sessions={sessions}
        counts={counts}
        search={search}
        activeTab={status ?? 'all'}
      />
    </div>
  )
}
