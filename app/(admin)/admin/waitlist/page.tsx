import type { Metadata } from 'next'
import { db } from '@/lib/db'
import WaitlistClient from './_components/waitlist-client'

export const metadata: Metadata = { title: 'Liste d\'attente — MIA Académie' }

export default async function WaitlistPage() {
  const entries = await db.waitlist.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <WaitlistClient entries={entries} />
    </div>
  )
}
