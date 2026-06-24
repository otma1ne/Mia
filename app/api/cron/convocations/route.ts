import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendConvocationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret) {
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  const stats = {
    convocationsSent: 0,
    errors: [] as string[],
  }

  try {
    // Fetch center alert days (default 7)
    const center = await db.center.findFirst({
      select: { enrollmentAlertDays: true },
    })
    const alertDays = center?.enrollmentAlertDays ?? 7

    // Target: sessions happening between tomorrow and alertDays from now
    // where convocation has not been sent yet
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const targetEnd = new Date(now)
    targetEnd.setDate(targetEnd.getDate() + alertDays)
    targetEnd.setHours(23, 59, 59, 999)

    const sessions = await db.session.findMany({
      where: {
        date: { gte: tomorrow, lte: targetEnd },
        convocationSentAt: null,
      },
      include: {
        module:    { select: { title: true } },
        formation: { select: { title: true, type: true, enrollments: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { name: true, email: true } } },
        }}},
        trainer:   { select: { user: { select: { name: true } } } },
        room:      { select: { name: true } },
      },
    })

    for (const session of sessions) {
      const enrollments = session.formation.enrollments

      for (const enrollment of enrollments) {
        const user = enrollment.user
        if (!user.email) continue

        try {
          await sendConvocationEmail({
            to:             user.email,
            firstName:      user.name?.split(' ')[0] ?? 'Apprenant',
            formationTitle: session.formation.title,
            moduleName:     session.module.title,
            sessionDate:    session.date,
            startTime:      session.startTime,
            endTime:        session.endTime,
            trainerName:    session.trainer?.user?.name ?? null,
            roomName:       session.room?.name ?? null,
            formationType:  session.formation.type,
            notes:          session.notes,
          })

          stats.convocationsSent++
        } catch (err) {
          stats.errors.push(
            `Failed to send convocation for session ${session.id} to ${user.email}: ${err}`
          )
        }
      }

      // Mark convocation as sent for this session
      await db.session.update({
        where: { id: session.id },
        data:  { convocationSentAt: now },
      })
    }

    return NextResponse.json({ success: true, ...stats })
  } catch (err) {
    console.error('[cron/convocations] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}
