import type { Metadata } from 'next'
import { db } from '@/lib/db'
import AdminAttendanceClient from './_components/admin-attendance-client'
import { addDays, subDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const metadata: Metadata = {
  title: 'Présences — MIA Académie',
}

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string }>
}) {
  const { sessionId } = await searchParams

  // Get all sessions for admin (next 30 days)
  const now            = new Date()
  const thirtyDaysAgo   = subDays(now, 30)
  const thirtyDaysLater = addDays(now, 30)

  const allSessions = await db.session.findMany({
    where: {
      date: {
        gte: thirtyDaysAgo,
        lte: thirtyDaysLater,
      },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
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

  const sessionOptions = allSessions.map((s) => {
    const sessionDate = new Date(s.date)
    const isPast      = sessionDate < now
    const dateLabel   = format(sessionDate, 'dd MMM yyyy', { locale: fr })
    return {
      id:    s.id,
      label: `${isPast ? '↩ ' : ''}${dateLabel} • ${s.startTime} • ${s.module.formation.title} — ${s.module.title}`,
      date:  s.date,
    }
  })

  let selectedSessionData = null

  if (sessionId) {
    // Pre-fetch trainingSessionId so we can scope enrollments to this promotion
    const sessionMeta = await db.session.findUnique({
      where: { id: sessionId },
      select: { trainingSessionId: true },
    })

    selectedSessionData = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        module: {
          select: {
            title: true,
            formation: { select: { title: true } },
            enrollments: {
              where: {
                status: { not: 'DROPPED' },
                ...(sessionMeta?.trainingSessionId
                  ? { formationEnrollment: { trainingSessionId: sessionMeta.trainingSessionId } }
                  : {}),
              },
              select: {
                id: true,
                userId: true,
                formationEnrollmentId: true,
                user: { select: { name: true, email: true } },
              },
            },
          },
        },
        trainer: { include: { user: { select: { name: true } } } },
        room:    { select: { name: true } },
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
