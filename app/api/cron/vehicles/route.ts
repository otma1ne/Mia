import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getExpiringVehicles } from '@/app/actions/vehicles'
import { sendVehicleAlertEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get alert threshold from center settings
    const center = await db.center.findFirst({
      select: { email: true, vehicleAlertDays: true },
    })

    const alertDays = center?.vehicleAlertDays ?? 30
    const adminEmail = center?.email

    if (!adminEmail) {
      return NextResponse.json({ sent: false, reason: 'No center email configured' })
    }

    // Find vehicles with upcoming or overdue deadlines
    const expiring = await getExpiringVehicles(alertDays)

    if (expiring.length === 0) {
      return NextResponse.json({ sent: false, count: 0, reason: 'No expiring vehicles' })
    }

    // Send summary email to admin
    await sendVehicleAlertEmail(adminEmail, expiring)

    return NextResponse.json({ sent: true, count: expiring.length })
  } catch (err) {
    console.error('[cron/vehicles] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
