'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface SessionEvent {
  id: string
  moduleId: string
  moduleTitle: string
  trainerName: string
  roomName: string | null
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
  const [modules, rooms] = await Promise.all([
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
  ])
  return { modules, rooms }
}

// ─────────────────────────────────────────
// Create session
// ─────────────────────────────────────────

export async function createSession(_prevState: unknown, formData: FormData) {
  const moduleId  = (formData.get('moduleId')  as string)?.trim()
  const roomId    = (formData.get('roomId')    as string)?.trim() || null
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

  await db.session.create({
    data: {
      moduleId,
      roomId: roomId || null,
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
