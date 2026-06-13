import { getAllContacts, getCommercials } from '@/app/actions/commercial'
import type { ContactStatus } from '@prisma/client'
import AdminContactsClient from './_components/admin-contacts-client'

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string; repId?: string }>
}

export default async function AdminCommercialPage({ searchParams }: Props) {
  const sp = await searchParams
  const page   = Math.max(1, Number(sp.page ?? 1))
  const search = sp.search ?? ''
  const status = sp.status as ContactStatus | undefined
  const repId  = sp.repId ?? undefined

  const [result, commercials] = await Promise.all([
    getAllContacts({ page, pageSize: 10, search, status, repId }),
    getCommercials(),
  ])

  return (
    <AdminContactsClient
      initialData={result}
      commercials={commercials}
      search={search}
      currentStatus={status}
      currentPage={page}
      currentRepId={repId}
    />
  )
}
