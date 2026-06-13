import type { Metadata } from 'next'
import { getVehicles, getArchivedVehiclesCount } from '@/app/actions/vehicles'
import type { VehicleStatus } from '@prisma/client'
import VehiclesClient from './_components/vehicles-client'

export const metadata: Metadata = { title: 'Véhicules — EduDrive' }

const VALID_STATUSES = new Set<VehicleStatus>(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'SOLD'])

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const { page: pageParam, search = '', status: statusParam } = await searchParams

  const page   = Math.max(1, Number(pageParam) || 1)
  const status = VALID_STATUSES.has(statusParam as VehicleStatus)
    ? (statusParam as VehicleStatus)
    : undefined

  const [data, archivedCount] = await Promise.all([
    getVehicles({ page, search, status }),
    getArchivedVehiclesCount(),
  ])

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <VehiclesClient
        data={data}
        search={search}
        activeStatus={status ?? 'all'}
        archivedCount={archivedCount}
      />
    </div>
  )
}
