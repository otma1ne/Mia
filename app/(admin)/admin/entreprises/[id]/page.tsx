import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCompany, getTrainingSessionsForSelect } from '@/app/actions/companies'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import CompanyDetailClient from './_components/company-detail-client'

export const metadata: Metadata = { title: 'Détail entreprise — MIA Académie' }

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const [company, sessions] = await Promise.all([
    getCompany(params.id),
    getTrainingSessionsForSelect(),
  ])

  if (!company) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/entreprises"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Entreprises
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{company.raisonSociale}</span>
      </div>

      <CompanyDetailClient
        companyId={company.id}
        raisonSociale={company.raisonSociale}
        nomDirigeant={company.nomDirigeant}
        prenomDirigeant={company.prenomDirigeant}
        fonction={company.fonction}
        email={company.email}
        phone={company.phone}
        siret={company.siret}
        adresse={company.adresse}
        employees={company.employees}
        inscriptions={company.inscriptions}
        sessions={sessions}
      />
    </div>
  )
}
