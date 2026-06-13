import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  sendBilanChaudEmail,
  sendBilanFroidEmail,
  sendBilanReminderEmail,
} from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret (from Vercel environment)
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  // Require secret in production, allow in development
  if (secret) {
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      console.error('[cron/formation-bilan] Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()
  const stats = {
    bilanChaudSent: 0,
    bilanFroidSent: 0,
    chaudReminders: 0,
    froidReminders: 0,
    errors: [] as string[],
  }

  try {
    // ────────────────────────────────────────────────────────────────
    // 0. Send Bilan Chaud when formation ends
    // ────────────────────────────────────────────────────────────────

    // 1. Get all formations that have ended
    const endedFormations = await db.formation.findMany({
      where: {
        endDate: {
          lte: now,
        },
      },
      select: { id: true },
    })

    // 2. Get enrollments in those formations, then filter for those without bilan chaud
    // (Filtering in code due to Prisma/MongoDB null handling issue with null queries)
    const allEnrollmentsInEndedFormations = await db.formationEnrollment.findMany({
      where: {
        formationId: {
          in: endedFormations.map(f => f.id),
        },
      },
      include: {
        user: { select: { email: true, name: true } },
        formation: { select: { title: true } },
      },
    })

    const enrollmentsForChaud = allEnrollmentsInEndedFormations.filter(e => !e.bilanChaudSentAt)

    for (const enrollment of enrollmentsForChaud) {
      try {
        // Create Bilan Chaud token
        const token = crypto.randomUUID()
        await db.formationBilan.create({
          data: {
            enrollmentId: enrollment.id,
            type: 'CHAUD',
            token,
            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        })

        // Send email
        await sendBilanChaudEmail(
          enrollment.user.email ?? '',
          enrollment.user.name ?? 'Apprenant',
          enrollment.formation.title,
          token
        )

        // Mark sent
        await db.formationEnrollment.update({
          where: { id: enrollment.id },
          data: { bilanChaudSentAt: now },
        })

        stats.bilanChaudSent++
      } catch (err) {
        stats.errors.push(`Failed to send Bilan Chaud for enrollment ${enrollment.id}: ${err}`)
      }
    }

    // ────────────────────────────────────────────────────────────────
    // 1. Send Bilan Froid for completions 3 months ago
    // ────────────────────────────────────────────────────────────────

    const threeMonthsAgo = new Date(now.getTime() - 3 * 30 * 24 * 60 * 60 * 1000)

    const enrollmentsForFroid = await db.formationEnrollment.findMany({
      where: {
        completedAt: {
          lte: threeMonthsAgo,
        },
        bilanFroidSentAt: null, // Haven't sent froid yet
      },
      include: {
        user: { select: { email: true, name: true } },
        formation: { select: { title: true } },
      },
    })

    for (const enrollment of enrollmentsForFroid) {
      try {
        // Create Bilan Froid token
        const token = crypto.randomUUID()
        await db.formationBilan.create({
          data: {
            enrollmentId: enrollment.id,
            type: 'FROID',
            token,
            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        })

        // Send email
        await sendBilanFroidEmail(
          enrollment.user.email ?? '',
          enrollment.user.name ?? 'Apprenant',
          enrollment.formation.title,
          token
        )

        // Mark sent
        await db.formationEnrollment.update({
          where: { id: enrollment.id },
          data: { bilanFroidSentAt: now },
        })

        stats.bilanFroidSent++
      } catch (err) {
        stats.errors.push(`Failed to send Bilan Froid for enrollment ${enrollment.id}: ${err}`)
      }
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Send reminders for incomplete Bilan Chaud (15+ days old)
    // ────────────────────────────────────────────────────────────────

    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)

    const chaudBilansNeedingReminder = await db.formationBilan.findMany({
      where: {
        type: 'CHAUD',
        usedAt: null, // Not completed
        createdAt: { lte: fifteenDaysAgo }, // Created 15+ days ago
        enrollment: {
          bilanChaudRemindedAt: null, // Haven't sent reminder yet
        },
      },
      include: {
        enrollment: {
          include: {
            user: { select: { email: true, name: true } },
            formation: { select: { title: true } },
          },
        },
      },
    })

    for (const bilan of chaudBilansNeedingReminder) {
      try {
        await sendBilanReminderEmail(
          bilan.enrollment.user.email ?? '',
          bilan.enrollment.user.name ?? 'Apprenant',
          bilan.enrollment.formation.title,
          bilan.token,
          'CHAUD'
        )

        await db.formationEnrollment.update({
          where: { id: bilan.enrollmentId },
          data: { bilanChaudRemindedAt: now },
        })

        stats.chaudReminders++
      } catch (err) {
        stats.errors.push(`Failed to send Bilan Chaud reminder for ${bilan.id}: ${err}`)
      }
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Send reminders for incomplete Bilan Froid (15+ days old)
    // ────────────────────────────────────────────────────────────────

    const froidBilansNeedingReminder = await db.formationBilan.findMany({
      where: {
        type: 'FROID',
        usedAt: null, // Not completed
        createdAt: { lte: fifteenDaysAgo }, // Created 15+ days ago
        enrollment: {
          bilanFroidRemindedAt: null, // Haven't sent reminder yet
        },
      },
      include: {
        enrollment: {
          include: {
            user: { select: { email: true, name: true } },
            formation: { select: { title: true } },
          },
        },
      },
    })

    for (const bilan of froidBilansNeedingReminder) {
      try {
        await sendBilanReminderEmail(
          bilan.enrollment.user.email ?? '',
          bilan.enrollment.user.name ?? 'Apprenant',
          bilan.enrollment.formation.title,
          bilan.token,
          'FROID'
        )

        await db.formationEnrollment.update({
          where: { id: bilan.enrollmentId },
          data: { bilanFroidRemindedAt: now },
        })

        stats.froidReminders++
      } catch (err) {
        stats.errors.push(`Failed to send Bilan Froid reminder for ${bilan.id}: ${err}`)
      }
    }

    // Return summary
    return NextResponse.json({
      success: true,
      ...stats,
    })
  } catch (err) {
    console.error('[cron/formation-bilan] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}
