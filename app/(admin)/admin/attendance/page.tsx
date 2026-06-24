import type { Metadata } from 'next'
import { db } from '@/lib/db'
import AdminAttendanceClient from './_components/admin-attendance-client'
import { addDays } from 'date-fns'

export const metadata: Metadata = {
  title: 'Présences — MIA Formation',
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { sessionId } = await searchParams

  // Get all sessions for admin (next 30 days)
  const now = new Date()
  const thirtyDaysLater = addDays(now, 30)

  const allSessions = await db.session.findMany({
    where: {
      date: {
        gte: now,
        lte: thirtyDaysLater,
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    select: {
      id: true,
      date: true,
      startTime: true,
      endTime: true,
      module: {
        select: {
          title: true,
          formation: { select: { title: true } },
        },
      },
      room: { select: { name: true } },
      _count: { select: { attendances: true } },
    },
  })

  const sessionOptions = allSessions.map((s) => ({
    id: s.id,
    label: `${s.module.formation.title} • ${s.module.title} • ${s.startTime}`,
    date: s.date,
  }))

  let selectedSessionData = null

  if (sessionId) {
    selectedSessionData = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        module: {
          select: {
            title: true,
            formation: { select: { title: true } },
            enrollments: {
              select: {
                id: true,
                userId: true,
                formationEnrollmentId: true,
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        room: { select: { name: true } },
        attendances: {
          select: {
            id: true,
            status: true,
            moduleEnrollmentId: true,
            note: true,
          },
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <h1 className="text-lg font-semibold">Gestion des présences</h1>
        <p className="text-sm text-muted-foreground">
          Consultez et gérez les présences pour toutes les séances pratiques.
        </p>
      </div>

      <AdminAttendanceClient
        sessionOptions={sessionOptions}
        selectedSessionId={sessionId ?? null}
        sessionData={selectedSessionData}
      />
    </div>
  )
}
