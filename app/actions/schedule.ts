'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface SessionEvent {
  id: string
  moduleId: string
  formationId: string
  moduleTitle: string
  formationTitle: string
  trainerName: string
  trainerId: string | null
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
      room:      { select: { name: true } },
      trainer:   { include: { user: { select: { name: true } } } },
      formation: { select: { title: true } },
      module: {
        select: {
          title: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  })

  return sessions.map(s => ({
    id:             s.id,
    moduleId:       s.moduleId,
    formationId:    s.formationId,
    moduleTitle:    s.module.title,
    formationTitle: s.formation.title,
    trainerName:    s.trainer?.user.name ?? '—',
    trainerId:      s.trainerId,
    roomName:       s.room?.name ?? null,
    date:           s.date,
    startTime:      s.startTime,
    endTime:        s.endTime,
    notes:          s.notes,
    enrollmentCount: s.module._count.enrollments,
  }))
}

// ─────────────────────────────────────────
// Lookup data for create form
// Only PRACTICAL modules have sessions
// ─────────────────────────────────────────

export async function getScheduleFormData() {
  const [modules, rooms, trainers] = await Promise.all([
    db.module.findMany({
      where: { status: { in: ['PUBLISHED', 'DRAFT'] } },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, formationId: true },
    }),
    db.room.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, capacity: true },
    }),
    db.trainer.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])
  return { modules, rooms, trainers }
}

// ─────────────────────────────────────────
// Create session
// ─────────────────────────────────────────

export async function createSession(_prevState: unknown, formData: FormData) {
  const moduleId  = (formData.get('moduleId')  as string)?.trim()
  const roomId    = (formData.get('roomId')    as string)?.trim() || null
  const trainerId = (formData.get('trainerId') as string)?.trim() || null
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

  const module = await db.module.findUnique({
    where: { id: moduleId },
    select: { formationId: true },
  })
  if (!module) {
    return { error: 'Module introuvable.' }
  }

  await db.session.create({
    data: {
      moduleId,
      formationId: module.formationId,
      roomId:      roomId || null,
      trainerId:   trainerId || null,
      date:        new Date(date),
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
