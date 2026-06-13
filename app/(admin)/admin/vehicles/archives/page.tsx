import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronLeft, Archive } from 'lucide-react'
import { getArchivedVehicles } from '@/app/actions/vehicles'
import ArchivesClient from './_components/archives-client'

export const metadata: Metadata = { title: 'Véhicules archivés — EduDrive' }

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>
}

export default async function ArchivesPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '' } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const data = await getArchivedVehicles({ page, search })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/vehicles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Véhicules
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Archive className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Véhicules archivés</h1>
      </div>
      <ArchivesClient data={data} search={search} />
    </div>
  )
}
