'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface SessionEvent {
  id: string
  moduleId: string
  moduleTitle: string
  trainerName: string
  roomName: string | null
  vehicleName: string | null
  date: Date
  startTime: string
  endTime: string
  notes: string | null
  enrollmentCount: number
}

// ─────────────────────────────────────────
// Get sessions for a given range
// ─────────────────────────────────────────

export async function getSessions({
  from,
  to,
}: {
  from: Date
  to: Date
}): Promise<SessionEvent[]> {
  const sessions = await db.session.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: {
      room: { select: { name: true } },
      vehicle: { select: { name: true, plate: true } },
      module: {
        select: {
          title: true,
          trainer: { include: { user: { select: { name: true } } } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  })

  return sessions.map(s => ({
    id: s.id,
    moduleId: s.moduleId,
    moduleTitle: s.module.title,
    trainerName: s.module.trainer?.user.name ?? '—',
    roomName: s.room?.name ?? null,
    vehicleName: s.vehicle ? `${s.vehicle.name} (${s.vehicle.plate})` : null,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    notes: s.notes,
    enrollmentCount: s.module._count.enrollments,
  }))
}

// ─────────────────────────────────────────
// Lookup data for create form
// Only PRACTICAL modules have sessions
// ─────────────────────────────────────────

export async function getScheduleFormData() {
  const [modules, rooms, vehicles] = await Promise.all([
    db.module.findMany({
      where: {
        type: 'PRACTICAL',
        status: { in: ['PUBLISHED', 'DRAFT'] },
      },
      orderBy: { title: 'asc' },
      select: { id: true, title: true },
    }),
    db.room.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, capacity: true },
    }),
    db.vehicle.findMany({
      where: { status: { not: 'MAINTENANCE' } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, plate: true, status: true },
    }),
  ])
  return { modules, rooms, vehicles }
}

// ─────────────────────────────────────────
// Create session
// ─────────────────────────────────────────

export async function createSession(_prevState: unknown, formData: FormData) {
  const moduleId  = (formData.get('moduleId')  as string)?.trim()
  const roomId    = (formData.get('roomId')    as string)?.trim() || null
  const vehicleId = (formData.get('vehicleId') as string)?.trim() || null
  const date      = (formData.get('date')      as string)?.trim()
  const startTime = (formData.get('startTime') as string)?.trim()
  const endTime   = (formData.get('endTime')   as string)?.trim()
  const notes     = (formData.get('notes')     as string)?.trim() || null

  if (!moduleId || !date || !startTime || !endTime) {
    return { error: 'Module, date, heure de début et heure de fin sont requis.' }
  }

  if (startTime >= endTime) {
    return { error: "L'heure de fin doit être après l'heure de début." }
  }

  // Vehicle conflict check — same vehicle cannot overlap on the same day
  if (vehicleId) {
    const sessionDate = new Date(date)
    const dayStart = new Date(sessionDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(sessionDate)
    dayEnd.setHours(23, 59, 59, 999)

    const conflict = await db.session.findFirst({
      where: {
        vehicleId,
        date: { gte: dayStart, lte: dayEnd },
        // Overlap condition: existing.startTime < newEndTime && existing.endTime > newStartTime
        AND: [
          { startTime: { lt: endTime } },
          { endTime:   { gt: startTime } },
        ],
      },
    })

    if (conflict) {
      return {
        error: `Ce véhicule est déjà réservé de ${conflict.startTime} à ${conflict.endTime} ce jour-là.`,
      }
    }
  }

  await db.session.create({
    data: {
      moduleId,
      roomId: roomId || null,
      vehicleId: vehicleId || null,
      date: new Date(date),
      startTime,
      endTime,
      notes,
    },
  })

  revalidatePath('/admin/schedule')
  return { success: true }
}

// ─────────────────────────────────────────
// Delete session
// ─────────────────────────────────────────

export async function deleteSession(id: string) {
  await db.session.delete({ where: { id } })
  revalidatePath('/admin/schedule')
}
