import type { Metadata } from 'next'
import { getInscriptions } from '@/app/actions/inscriptions'
import { getAdminInscriptionFormData } from '@/app/actions/admin-inscriptions'
import InscriptionsClient from './_components/inscriptions-client'

export const metadata: Metadata = { title: 'Inscriptions — MIA Académie' }

export default async function InscriptionsPage() {
  const [inscriptions, formData] = await Promise.all([
    getInscriptions(),
    getAdminInscriptionFormData(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <InscriptionsClient
        inscriptions={inscriptions}
        students={formData.students}
        formations={formData.formations}
        sessions={formData.sessions}
      />
    </div>
  )
}
