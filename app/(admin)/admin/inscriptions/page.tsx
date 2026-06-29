import type { Metadata } from 'next'
import { getInscriptions } from '@/app/actions/inscriptions'
import InscriptionsClient from './_components/inscriptions-client'

export const metadata: Metadata = { title: 'Inscriptions — MIA Académie' }

export default async function InscriptionsPage() {
  const inscriptions = await getInscriptions()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <InscriptionsClient inscriptions={inscriptions} />
    </div>
  )
}
