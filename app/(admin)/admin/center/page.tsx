import type { Metadata } from 'next'
import { getCenter } from '@/app/actions/center'
import CenterInfoForm from './_components/center-info-form'
import OperatingHoursForm from './_components/operating-hours-form'
import RoomsManager from './_components/rooms-manager'
import CenterLegalForm from './_components/center-legal-form'

export const metadata: Metadata = { title: 'Centre — EduDrive' }

export default async function CenterPage() {
  const center = await getCenter()

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl">
      {/* Center info */}
      <CenterInfoForm
        center={center
          ? {
              id: center.id,
              name: center.name,
              address: center.address,
              phone: center.phone,
              email: center.email,
              description: center.description,
              vehicleAlertDays: center.vehicleAlertDays,
            }
          : null
        }
      />

      {/* Operating hours — only if center exists */}
      {center && (
        <OperatingHoursForm
          centerId={center.id}
          initialHours={center.operatingHours}
        />
      )}

      {/* Rooms — only if center exists */}
      {center && (
        <RoomsManager
          centerId={center.id}
          initialRooms={center.rooms}
        />
      )}

      {/* Legal documents (règlement + CGV) — only if center exists */}
      {center && (
        <CenterLegalForm
          centerId={center.id}
          initialReglement={center.reglement ?? null}
          initialCgv={center.cgv ?? null}
        />
      )}

      {!center && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Save your center information first to unlock operating hours and room management.
        </p>
      )}
    </div>
  )
}
