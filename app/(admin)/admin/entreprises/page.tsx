import type { Metadata } from 'next'
import { getCompanies } from '@/app/actions/companies'
import CompaniesClient from './_components/companies-client'

export const metadata: Metadata = { title: 'Entreprises — MIA Académie' }

export default async function EntreprisesPage() {
  const companies = await getCompanies()

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Entreprises</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez les espaces entreprises et leurs inscriptions aux formations.
        </p>
      </div>
      <CompaniesClient companies={companies} />
    </div>
  )
}
