import type { Metadata } from 'next'
import { getCenters } from '@/app/actions/center'
import CentersListClient from './_components/centers-list-client'

export const metadata: Metadata = { title: 'Centres — MIA Formation' }

export default async function CentersPage() {
  const centers = await getCenters()

  return (
    <div className="p-4 lg:p-6 max-w-3xl">
      <CentersListClient centers={centers} />
    </div>
  )
}
