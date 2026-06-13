'use client'

import { useRouter } from 'next/navigation'
import type { VehicleRow } from '@/app/actions/vehicles'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Build a flat list of per-deadline alert items from the vehicle rows
interface AlertItem {
  vehicleId: string
  vehicleName: string
  plate: string
  type: 'inspection' | 'insurance'
  date: Date
  isExpired: boolean
  daysLeft: number
}

function buildAlertItems(vehicles: VehicleRow[]): AlertItem[] {
  const now = new Date()
  const items: AlertItem[] = []

  for (const v of vehicles) {
    if (v.isAlertInspection && v.inspectionDate) {
      const daysLeft = Math.ceil((new Date(v.inspectionDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      items.push({
        vehicleId: v.id,
        vehicleName: v.name,
        plate: v.plate,
        type: 'inspection',
        date: v.inspectionDate,
        isExpired: v.isExpiredInspection,
        daysLeft,
      })
    }
    if (v.isAlertInsurance && v.insuranceExpiry) {
      const daysLeft = Math.ceil((new Date(v.insuranceExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      items.push({
        vehicleId: v.id,
        vehicleName: v.name,
        plate: v.plate,
        type: 'insurance',
        date: v.insuranceExpiry,
        isExpired: v.isExpiredInsurance,
        daysLeft,
      })
    }
  }

  // Expired first, then soonest
  return items.sort((a, b) => {
    if (a.isExpired !== b.isExpired) return a.isExpired ? -1 : 1
    return a.daysLeft - b.daysLeft
  })
}

interface VehicleAlertsDropdownProps {
  vehicles: VehicleRow[]
}

export default function VehicleAlertsDropdown({ vehicles }: VehicleAlertsDropdownProps) {
  const router = useRouter()
  const items = buildAlertItems(vehicles)
  const expiredCount = items.filter(i => i.isExpired).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Alertes véhicules"
            className="relative cursor-pointer rounded-full p-1.5 text-muted-foreground outline-none hover:text-foreground transition-colors"
          />
        }
      >
        <Bell className="h-4.5 w-4.5" />
        {/* Badge */}
        <span className={cn(
          'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white leading-none',
          expiredCount > 0 ? 'bg-destructive' : 'bg-amber-500'
        )}>
          {items.length}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Alertes véhicules</span>
            <span className="text-xs font-normal text-muted-foreground">
              {items.length} échéance{items.length > 1 ? 's' : ''}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <div className="max-h-72 overflow-y-auto">
          {items.map((item, i) => (
            <DropdownMenuItem
              key={`${item.vehicleId}-${item.type}`}
              onClick={() => router.push('/admin/vehicles')}
              className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
            >
              {/* Icon */}
              {item.isExpired ? (
                <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              )}

              {/* Content */}
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm font-medium truncate">{item.vehicleName}</p>
                <p className="text-xs text-muted-foreground">
                  {item.type === 'inspection' ? 'Visite technique' : 'Assurance'}
                  {' · '}
                  {format(new Date(item.date), 'd MMM yyyy', { locale: fr })}
                </p>
                <p className={cn(
                  'text-xs font-medium',
                  item.isExpired ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {item.isExpired
                    ? `Expirée depuis ${Math.abs(item.daysLeft)} jour${Math.abs(item.daysLeft) > 1 ? 's' : ''}`
                    : `Dans ${item.daysLeft} jour${item.daysLeft > 1 ? 's' : ''}`}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/admin/vehicles')}
          className="justify-center text-xs text-muted-foreground cursor-pointer"
        >
          Voir tous les véhicules
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
