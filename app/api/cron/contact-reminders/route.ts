import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendContactReminderEmail } from '@/lib/email'

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
  const stats = { remindersSent: 0, errors: [] as string[] }

  try {
    const contacts = await db.contact.findMany({
      where: {
        status:        'INDECIS',
        reminderDate:  { lte: now },
        reminderSentAt: null,
      },
      include: {
        commercial: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    })

    for (const contact of contacts) {
      const commercialEmail = contact.commercial.user.email
      if (!commercialEmail) continue

      try {
        await sendContactReminderEmail({
          to:               commercialEmail,
          commercialName:   contact.commercial.user.name ?? commercialEmail,
          contactFirstName: contact.firstName,
          contactLastName:  contact.lastName,
          contactPhone:     contact.phone,
          contactNeed:      contact.need,
        })

        await db.contact.update({
          where: { id: contact.id },
          data:  { reminderSentAt: now },
        })

        stats.remindersSent++
      } catch (err) {
        stats.errors.push(`Contact ${contact.id}: ${err}`)
      }
    }

    return NextResponse.json({ success: true, ...stats })
  } catch (err) {
    console.error('[cron/contact-reminders] Error:', err)
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    )
  }
}
