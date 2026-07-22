import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getCenterById } from '@/app/actions/center'
import { getSkills } from '@/app/actions/skills'
import CenterInfoForm from '../_components/center-info-form'
import OperatingHoursForm from '../_components/operating-hours-form'
import RoomsManager from '../_components/rooms-manager'
import CenterLegalForm from '../_components/center-legal-form'
import CenterAccessPlansForm from '../_components/center-access-plans-form'
import SkillsManager from '@/app/(admin)/admin/center/_components/skills-manager'

export const metadata: Metadata = { title: 'Centre — MIA Académie' }

export default async function CenterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [center, skills] = await Promise.all([
    getCenterById(id),
    getSkills(),
  ])

  if (!center) notFound()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/center"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm hover:bg-muted transition-colors"
          aria-label="Retour à la liste"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-base font-semibold">{center.name}</h1>
          <p className="text-xs text-muted-foreground">{center.address}</p>
        </div>
      </div>

      {/* Informations */}
      <CenterInfoForm
        center={{
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          email: center.email,
          description: center.description,
          enrollmentAlertDays: center.enrollmentAlertDays,
        }}
      />

      {/* Horaires */}
      <OperatingHoursForm
        centerId={center.id}
        initialHours={center.operatingHours}
      />

      {/* Salles */}
      <RoomsManager
        centerId={center.id}
        initialRooms={center.rooms}
      />

      {/* Documents légaux */}
      <CenterLegalForm
        centerId={center.id}
        initialReglement={center.reglement ?? null}
        initialCgv={center.cgv ?? null}
      />

      {/* Plans d'accès */}
      <CenterAccessPlansForm
        centerId={center.id}
        initialPlans={center.accessPlans ?? []}
      />

      {/* Compétences intervenants */}
      <SkillsManager initialSkills={skills} />
    </div>
  )
}
