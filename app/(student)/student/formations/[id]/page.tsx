import { notFound } from 'next/navigation'
import { getFormationDetail } from '@/app/actions/student-dashboard'
import FormationDetailClient from './_components/formation-detail-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FormationDetailPage({ params }: Props) {
  const { id } = await params
  const formation = await getFormationDetail(id)

  if (!formation) notFound()

  return (
    <div className="flex flex-col gap-6 p-6">
      <FormationDetailClient formation={formation} />
    </div>
  )
}
