'use client'

import { useEffect, useState } from 'react'
import { getVehicleEvents } from '@/app/actions/vehicles'
import type { VehicleEventRow } from '@/app/actions/vehicles'
import { Tag, Archive, RotateCcw, ArrowRightLeft, History } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ICONS: Record<VehicleEventRow['type'], React.ElementType> = {
  SOLD:        Tag,
  ARCHIVED:    Archive,
  REACTIVATED: RotateCcw,
  TRANSFERRED: ArrowRightLeft,
}

const LABELS: Record<VehicleEventRow['type'], string> = {
  SOLD:        'Vendu',
  ARCHIVED:    'Archivé',
  REACTIVATED: 'Réactivé',
  TRANSFERRED: 'Transféré',
}

interface Props { vehicleId: string }

export default function VehicleHistoryTimeline({ vehicleId }: Props) {
  const [events, setEvents] = useState<VehicleEventRow[] | null>(null)

  useEffect(() => {
    getVehicleEvents(vehicleId).then(setEvents)
  }, [vehicleId])

  return (
    <div className="border-t pt-4 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <History className="h-3 w-3" /> Historique
      </p>

      {events === null ? (
        <p className="text-xs text-muted-foreground">Chargement…</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted-foreground">Aucun évènement.</p>
      ) : (
        <ol className="space-y-3">
          {events.map(e => {
            const Icon = ICONS[e.type]
            return (
              <li key={e.id} className="flex gap-3">
                <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <span className="font-medium">{LABELS[e.type]}</span>
                    <span className="text-muted-foreground"> · {format(new Date(e.occurredAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.actor ? <>par {e.actor.name}</> : 'par système'}
                  </p>
                  {e.note && <p className="text-xs text-muted-foreground italic mt-0.5">« {e.note} »</p>}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
