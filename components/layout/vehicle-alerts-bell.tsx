import { db } from '@/lib/db'
import { getExpiringVehicles } from '@/app/actions/vehicles'
import VehicleAlertsDropdown from './vehicle-alerts-dropdown'

export default async function VehicleAlertsBell() {
  const center = await db.center.findFirst({ select: { vehicleAlertDays: true } })
  const alertDays = center?.vehicleAlertDays ?? 30
  const vehicles = await getExpiringVehicles(alertDays)

  if (vehicles.length === 0) return null

  return <VehicleAlertsDropdown vehicles={vehicles} />
}
