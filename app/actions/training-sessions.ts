'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { TrainingSessionStatus, TrainingNiveau } from '@prisma/client'
import { publishNotification } from '@/lib/pusher'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/unauthorized')
}

export type TrainingSessionRow = {
  id: string
  title: string
  niveau: TrainingNiveau | null
  startDate: Date
  endDate: Date
  status: TrainingSessionStatus
  maxStudents: number
  price: number | null
  location: string | null
  onlineUrl: string | null
  notes: string | null
  trainerId: string | null
  trainerName: string | null
  enrollmentCount: number
  inscriptionCount: number
}

export async function getTrainingSessionsForFormation(formationId: string): Promise<TrainingSessionRow[]> {
  await requireAdmin()
  const rows = await db.trainingSession.findMany({
    where: { formationId },
    orderBy: { startDate: 'asc' },
    include: {
      trainer: { include: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true, inscriptions: true } },
    },
  })
  return rows.map(r => ({
    id:               r.id,
    title:            r.title,
    niveau:           r.niveau,
    startDate:        r.startDate,
    endDate:          r.endDate,
    status:           r.status,
    maxStudents:      r.maxStudents,
    price:            r.price,
    location:         r.location,
    onlineUrl:        r.onlineUrl,
    notes:            r.notes,
    trainerId:        r.trainerId,
    trainerName:      r.trainer?.user.name ?? null,
    enrollmentCount:  r._count.enrollments,
    inscriptionCount: r._count.inscriptions,
  }))
}

export async function createTrainingSession(formationId: string, data: {
  title: string
  niveau?: TrainingNiveau | null
  startDate: string
  endDate: string
  maxStudents: number
  price?: number | null
  trainerId?: string | null
  location?: string | null
  onlineUrl?: string | null
  notes?: string | null
  status?: TrainingSessionStatus
}): Promise<{ error?: string }> {
  await requireAdmin()
  try {
    await db.trainingSession.create({
      data: {
        formationId,
        title:       data.title,
        niveau:      data.niveau ?? null,
        startDate:   new Date(data.startDate),
        endDate:     new Date(data.endDate),
        maxStudents: data.maxStudents,
        price:       data.price ?? null,
        trainerId:   data.trainerId ?? null,
        location:    data.location ?? null,
        onlineUrl:   data.onlineUrl ?? null,
        notes:       data.notes ?? null,
        status:      data.status ?? 'DRAFT',
      },
    })
    revalidatePath(`/admin/formations/${formationId}`)
    return {}
  } catch {
    return { error: 'Erreur lors de la création de la session.' }
  }
}

const SESSION_STATUS_LABELS: Record<TrainingSessionStatus, string> = {
  DRAFT:     'Brouillon',
  OPEN:      'Ouverte',
  STARTED:   'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
}

export async function updateTrainingSessionStatus(id: string, status: TrainingSessionStatus): Promise<void> {
  await requireAdmin()
  const ts = await db.trainingSession.findUnique({
    where: { id },
    select: { formationId: true, title: true },
  })
  if (!ts) return
  await db.trainingSession.update({ where: { id }, data: { status } })
  revalidatePath(`/admin/formations/${ts.formationId}`)

  publishNotification({
    type:  'SESSION_CHANGED',
    title: 'Statut de session modifié',
    body:  `est maintenant ${SESSION_STATUS_LABELS[status] ?? status}`,
    href:  `/admin/formations/${ts.formationId}`,
    data:  { sessionTitle: ts.title },
  }).catch(() => {})
}

export async function updateTrainingSession(id: string, data: {
  title?: string
  niveau?: TrainingNiveau | null
  startDate?: string
  endDate?: string
  maxStudents?: number
  price?: number | null
  trainerId?: string | null
  location?: string | null
  onlineUrl?: string | null
  notes?: string | null
}): Promise<{ error?: string }> {
  await requireAdmin()
  const ts = await db.trainingSession.findUnique({ where: { id }, select: { formationId: true } })
  if (!ts) return { error: 'Session introuvable.' }
  try {
    await db.trainingSession.update({
      where: { id },
      data: {
        ...(data.title       !== undefined && { title: data.title }),
        ...(data.niveau      !== undefined && { niveau: data.niveau }),
        ...(data.startDate   !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate     !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.maxStudents !== undefined && { maxStudents: data.maxStudents }),
        ...(data.price       !== undefined && { price: data.price }),
        ...(data.trainerId   !== undefined && { trainerId: data.trainerId }),
        ...(data.location    !== undefined && { location: data.location }),
        ...(data.onlineUrl   !== undefined && { onlineUrl: data.onlineUrl }),
        ...(data.notes       !== undefined && { notes: data.notes }),
      },
    })
    revalidatePath(`/admin/formations/${ts.formationId}`)
    return {}
  } catch {
    return { error: 'Erreur lors de la mise à jour.' }
  }
}
