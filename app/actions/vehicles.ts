'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { VehicleStatus } from '@prisma/client'
import {
  createVehicleSchema,
  updateVehicleSchema,
  markVehicleSoldSchema,
  archiveVehicleSchema,
  updateSaleInfoSchema,
  formatValidationError,
} from '@/lib/validations'
import { auth } from '@/auth'
import type { ZodError } from 'zod'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface SaleInfoData {
  buyerFirstName: string
  buyerLastName:  string
  buyerPhone:     string
  buyerEmail:     string | null
  saleDate:       Date
  salePrice:      number
}

export interface VehicleRow {
  id: string
  name: string
  plate: string
  category: string
  status: VehicleStatus
  photo: string | null
  mileage: number
  inspectionDate: Date | null
  insuranceExpiry: Date | null
  archived: boolean
  archivedAt: Date | null
  sale: SaleInfoData | null
  isAlertInspection: boolean
  isAlertInsurance: boolean
  isExpiredInspection: boolean
  isExpiredInsurance: boolean
  createdAt: Date
}

export interface VehiclesResult {
  vehicles: VehicleRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function computeAlerts(
  inspectionDate: Date | null,
  insuranceExpiry: Date | null,
  alertDays: number
) {
  const now = new Date()
  const threshold = new Date(now.getTime() + alertDays * 24 * 60 * 60 * 1000)

  const isExpiredInspection = inspectionDate ? inspectionDate < now : false
  const isAlertInspection   = inspectionDate ? inspectionDate <= threshold : false

  const isExpiredInsurance  = insuranceExpiry ? insuranceExpiry < now : false
  const isAlertInsurance    = insuranceExpiry ? insuranceExpiry <= threshold : false

  return { isAlertInspection, isAlertInsurance, isExpiredInspection, isExpiredInsurance }
}

async function getAlertDays(): Promise<number> {
  const center = await db.center.findFirst({ select: { vehicleAlertDays: true } })
  return center?.vehicleAlertDays ?? 30
}

async function getActorId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

function mapVehicle(
  v: {
    id: string; name: string; plate: string; category: string
    status: VehicleStatus; photo: string | null; mileage: number
    inspectionDate: Date | null; insuranceExpiry: Date | null
    archived: boolean; archivedAt: Date | null
    sale: SaleInfoData | null
    createdAt: Date
  },
  alertDays: number
): VehicleRow {
  const alerts = computeAlerts(v.inspectionDate, v.insuranceExpiry, alertDays)
  return { ...v, ...alerts }
}

// ─────────────────────────────────────────
// Get paginated vehicles list
// ─────────────────────────────────────────

export async function getVehicles({
  page = 1,
  pageSize = 10,
  search = '',
  status,
  includeArchived = false,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: VehicleStatus
  includeArchived?: boolean
} = {}): Promise<VehiclesResult> {
  const [alertDays, where] = await Promise.all([
    getAlertDays(),
    Promise.resolve({
      ...(includeArchived ? {} : { archived: false }),
      ...(status ? { status } : {}),
      ...(search.trim()
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { plate: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }),
  ])

  const [total, vehicles] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    vehicles: vehicles.map(v => mapVehicle(v, alertDays)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Archived vehicles
// ─────────────────────────────────────────

export async function getArchivedVehiclesCount(): Promise<number> {
  return db.vehicle.count({ where: { archived: true } })
}

export async function getArchivedVehicles({
  page = 1,
  pageSize = 10,
  search = '',
}: {
  page?: number
  pageSize?: number
  search?: string
} = {}): Promise<VehiclesResult> {
  const [alertDays, where] = await Promise.all([
    getAlertDays(),
    Promise.resolve({
      archived: true,
      ...(search.trim()
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { plate: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }),
  ])

  const [total, vehicles] = await Promise.all([
    db.vehicle.count({ where }),
    db.vehicle.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { archivedAt: 'desc' },
    }),
  ])

  return {
    vehicles: vehicles.map(v => mapVehicle(v, alertDays)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Get single vehicle
// ─────────────────────────────────────────

export async function getVehicle(id: string): Promise<VehicleRow | null> {
  const [vehicle, alertDays] = await Promise.all([
    db.vehicle.findUnique({ where: { id } }),
    getAlertDays(),
  ])
  if (!vehicle) return null
  return mapVehicle(vehicle, alertDays)
}

// ─────────────────────────────────────────
// Get expiring vehicles (for cron)
// ─────────────────────────────────────────

export async function getExpiringVehicles(alertDays: number): Promise<VehicleRow[]> {
  const threshold = new Date(Date.now() + alertDays * 24 * 60 * 60 * 1000)

  const vehicles = await db.vehicle.findMany({
    where: {
      OR: [
        { inspectionDate: { lte: threshold } },
        { insuranceExpiry: { lte: threshold } },
      ],
    },
    orderBy: { inspectionDate: 'asc' },
  })

  return vehicles.map(v => mapVehicle(v, alertDays))
}

// ─────────────────────────────────────────
// Create vehicle
// ─────────────────────────────────────────

export async function createVehicle(_prevState: unknown, formData: FormData) {
  try {
    // Validate input
    const validatedData = createVehicleSchema.parse({
      name: formData.get('name'),
      plate: formData.get('plate'),
      category: formData.get('category'),
      status: formData.get('status'),
      photo: formData.get('photo'),
      mileage: formData.get('mileage'),
      inspectionDate: formData.get('inspectionDate'),
      insuranceExpiry: formData.get('insuranceExpiry'),
    })

    // Check for duplicate plate
    const existing = await db.vehicle.findUnique({ where: { plate: validatedData.plate } })
    if (existing) {
      return { error: `Un véhicule avec l'immatriculation ${validatedData.plate} existe déjà.` }
    }

    await db.vehicle.create({
      data: validatedData,
    })

    revalidatePath('/admin/vehicles')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'errors' in err) {
      return { error: formatValidationError(err as any) }
    }
    console.error('[createVehicle]', err)
    return { error: 'Erreur lors de la création du véhicule' }
  }
}

// ─────────────────────────────────────────
// Update vehicle
// ─────────────────────────────────────────

export async function updateVehicle(
  id: string,
  data: {
    name: string
    plate: string
    category: string
    status: VehicleStatus
    photo: string | null
    mileage: number
    inspectionDate: Date | null
    insuranceExpiry: Date | null
  }
) {
  try {
    // Validate input
    const validatedData = updateVehicleSchema.parse(data)

    // Check for duplicate plate (excluding current vehicle)
    const conflict = await db.vehicle.findFirst({
      where: { plate: validatedData.plate, NOT: { id } }
    })
    if (conflict) {
      return { error: `L'immatriculation ${validatedData.plate} est déjà utilisée.` }
    }

    await db.vehicle.update({ where: { id }, data: validatedData })
    revalidatePath('/admin/vehicles')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'errors' in err) {
      return { error: formatValidationError(err as any) }
    }
    console.error('[updateVehicle]', err)
    return { error: 'Erreur lors de la mise à jour du véhicule' }
  }
}

// ─────────────────────────────────────────
// Update status only
// ─────────────────────────────────────────

export async function updateVehicleStatus(id: string, status: VehicleStatus) {
  await db.vehicle.update({ where: { id }, data: { status } })
  revalidatePath('/admin/vehicles')
}

// ─────────────────────────────────────────
// Delete vehicle
// ─────────────────────────────────────────

export async function deleteVehicle(id: string) {
  await db.vehicle.delete({ where: { id } })
  revalidatePath('/admin/vehicles')
}

// ─────────────────────────────────────────
// Event log
// ─────────────────────────────────────────

export interface VehicleEventRow {
  id: string
  type: 'SOLD' | 'ARCHIVED' | 'REACTIVATED' | 'TRANSFERRED'
  occurredAt: Date
  note: string | null
  metadata: unknown
  actor: { id: string; name: string } | null
}

export async function getVehicleEvents(vehicleId: string): Promise<VehicleEventRow[]> {
  const events = await db.vehicleEvent.findMany({
    where: { vehicleId },
    orderBy: { occurredAt: 'desc' },
    include: { actor: { select: { id: true, name: true } } },
  })
  return events.map(e => ({
    id: e.id,
    type: e.type,
    occurredAt: e.occurredAt,
    note: e.note,
    metadata: e.metadata,
    actor: e.actor,
  }))
}

// ─────────────────────────────────────────
// Mark as sold
// ─────────────────────────────────────────

export async function markVehicleAsSold(
  id: string,
  input: {
    buyerFirstName: string
    buyerLastName:  string
    buyerPhone:     string
    buyerEmail?:    string
    saleDate:       Date | string
    salePrice:      number | string
  }
) {
  try {
    const validated = markVehicleSoldSchema.parse(input)
    const actorId = await getActorId()

    const existing = await db.vehicle.findUnique({ where: { id }, select: { status: true, archived: true } })
    if (!existing) return { error: 'Véhicule introuvable' }
    if (existing.status === 'SOLD') return { error: 'Ce véhicule est déjà marqué comme vendu' }

    await db.$transaction([
      db.vehicle.update({
        where: { id },
        data: {
          status: 'SOLD',
          sale: {
            buyerFirstName: validated.buyerFirstName,
            buyerLastName:  validated.buyerLastName,
            buyerPhone:     validated.buyerPhone,
            buyerEmail:     validated.buyerEmail ?? null,
            saleDate:       validated.saleDate,
            salePrice:      validated.salePrice,
          },
        },
      }),
      db.vehicleEvent.create({
        data: {
          vehicleId: id,
          type: 'SOLD',
          actorId,
          metadata: {
            buyerFirstName: validated.buyerFirstName,
            buyerLastName:  validated.buyerLastName,
            saleDate:       validated.saleDate,
            salePrice:      validated.salePrice,
          },
        },
      }),
    ])

    revalidatePath('/admin/vehicles')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'errors' in err) {
      return { error: formatValidationError(err as unknown as ZodError) }
    }
    console.error('[markVehicleAsSold]', err)
    return { error: 'Erreur lors de l\'enregistrement de la vente' }
  }
}

// ─────────────────────────────────────────
// Archive
// ─────────────────────────────────────────

export async function archiveVehicle(id: string, note?: string) {
  try {
    const validated = archiveVehicleSchema.parse({ note })
    const actorId = await getActorId()

    const existing = await db.vehicle.findUnique({ where: { id }, select: { archived: true } })
    if (!existing) return { error: 'Véhicule introuvable' }
    if (existing.archived) return { error: 'Ce véhicule est déjà archivé' }

    await db.$transaction([
      db.vehicle.update({
        where: { id },
        data: { archived: true, archivedAt: new Date() },
      }),
      db.vehicleEvent.create({
        data: {
          vehicleId: id,
          type: 'ARCHIVED',
          actorId,
          note: validated.note ?? null,
        },
      }),
    ])

    revalidatePath('/admin/vehicles')
    revalidatePath('/admin/vehicles/archives')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'errors' in err) {
      return { error: formatValidationError(err as unknown as ZodError) }
    }
    console.error('[archiveVehicle]', err)
    return { error: 'Erreur lors de l\'archivage' }
  }
}

// ─────────────────────────────────────────
// Reactivate (admin-only, archived → AVAILABLE)
// ─────────────────────────────────────────

export async function reactivateVehicle(id: string) {
  try {
    const actorId = await getActorId()
    const existing = await db.vehicle.findUnique({ where: { id }, select: { archived: true, status: true } })
    if (!existing) return { error: 'Véhicule introuvable' }
    if (!existing.archived) return { error: 'Ce véhicule n\'est pas archivé' }
    if (existing.status === 'SOLD') {
      return { error: 'Un véhicule vendu ne peut pas être réactivé' }
    }

    await db.$transaction([
      db.vehicle.update({
        where: { id },
        data: { archived: false, archivedAt: null, status: 'AVAILABLE' },
      }),
      db.vehicleEvent.create({
        data: {
          vehicleId: id,
          type: 'REACTIVATED',
          actorId,
        },
      }),
    ])

    revalidatePath('/admin/vehicles')
    revalidatePath('/admin/vehicles/archives')
    return { success: true }
  } catch (err) {
    console.error('[reactivateVehicle]', err)
    return { error: 'Erreur lors de la réactivation' }
  }
}

// ─────────────────────────────────────────
// Edit sale info (typo correction — does NOT log a new event)
// ─────────────────────────────────────────

export async function updateVehicleSale(
  id: string,
  input: {
    buyerFirstName: string
    buyerLastName:  string
    buyerPhone:     string
    buyerEmail?:    string
    saleDate:       Date | string
    salePrice:      number | string
  }
) {
  try {
    const validated = updateSaleInfoSchema.parse(input)

    const existing = await db.vehicle.findUnique({ where: { id }, select: { status: true } })
    if (!existing) return { error: 'Véhicule introuvable' }
    if (existing.status !== 'SOLD') return { error: 'Ce véhicule n\'est pas vendu' }

    await db.vehicle.update({
      where: { id },
      data: {
        sale: {
          buyerFirstName: validated.buyerFirstName,
          buyerLastName:  validated.buyerLastName,
          buyerPhone:     validated.buyerPhone,
          buyerEmail:     validated.buyerEmail ?? null,
          saleDate:       validated.saleDate,
          salePrice:      validated.salePrice,
        },
      },
    })

    revalidatePath('/admin/vehicles')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'errors' in err) {
      return { error: formatValidationError(err as unknown as ZodError) }
    }
    console.error('[updateVehicleSale]', err)
    return { error: 'Erreur lors de la mise à jour de la vente' }
  }
}
