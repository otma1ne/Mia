import { getMyContacts } from '@/app/actions/commercial'
import type { ContactStatus } from '@prisma/client'
import ContactsClient from './_components/contacts-client'

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>
}

export default async function ContactsPage({ searchParams }: Props) {
  const sp = await searchParams
  const page   = Math.max(1, Number(sp.page ?? 1))
  const search = sp.search ?? ''
  const status = sp.status as ContactStatus | undefined

  const result = await getMyContacts({ page, pageSize: 10, search, status })

  return <ContactsClient initialData={result} search={search} currentStatus={status} currentPage={page} />
}
