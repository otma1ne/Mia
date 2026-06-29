import type { Metadata } from 'next'
import {
  getTrainerSessionOptions,
  getTrainerSessionsForAttendance,
} from '@/app/actions/trainer-dashboard'
import AttendanceClient from './_components/attendance-client'

export const metadata: Metadata = { title: 'Présences — MIA Académie' }

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { sessionId } = await searchParams

  const [sessionOptions, sessionData] = await Promise.all([
    getTrainerSessionOptions(),
    sessionId ? getTrainerSessionsForAttendance(sessionId) : Promise.resolve(null),
  ])

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Présences</h1>
        <p className="text-sm text-muted-foreground">Marquez la présence des étudiants pour vos séances.</p>
      </div>
      <AttendanceClient
        sessionOptions={sessionOptions}
        selectedSessionId={sessionId ?? null}
        sessionData={sessionData}
      />
    </div>
  )
}
