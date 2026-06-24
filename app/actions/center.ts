'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const LIST_PATH = '/admin/center'

function detailPath(centerId: string) {
  return `/admin/center/${centerId}`
}

// ─────────────────────────────────────────
// Get all centers (list)
// ─────────────────────────────────────────

export async function getCenters() {
  return db.center.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { rooms: true } },
    },
  })
}

// ─────────────────────────────────────────
// Get one center by ID (detail page)
// ─────────────────────────────────────────

export async function getCenterById(id: string) {
  return db.center.findUnique({
    where: { id },
    include: {
      operatingHours: { orderBy: { dayOfWeek: 'asc' } },
      rooms: { orderBy: { name: 'asc' } },
    },
  })
}

// ─────────────────────────────────────────
// Backward compat — used by inscriptions PDF
// ─────────────────────────────────────────

export async function getCenter() {
  return db.center.findFirst({
    include: {
      operatingHours: { orderBy: { dayOfWeek: 'asc' } },
      rooms: { orderBy: { name: 'asc' } },
    },
  })
}

// ─────────────────────────────────────────
// Upsert center info
// Returns { success, centerId } so callers can redirect after creation
// ─────────────────────────────────────────

export async function saveCenterInfo(_prevState: unknown, formData: FormData) {
  const name             = (formData.get('name')             as string)?.trim()
  const address          = (formData.get('address')          as string)?.trim()
  const phone            = (formData.get('phone')            as string)?.trim()
  const email            = (formData.get('email')            as string)?.trim()
  const description      = (formData.get('description')      as string)?.trim()
  const centerId         = (formData.get('centerId')         as string)?.trim() || null
  const enrollmentAlertDays = Math.max(1, parseInt(formData.get('enrollmentAlertDays') as string) || 7)

  if (!name || !address || !phone || !email) {
    return { error: 'Nom, adresse, téléphone et e-mail sont obligatoires.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { error: 'Adresse e-mail invalide.' }

  if (centerId) {
    await db.center.update({
      where: { id: centerId },
      data: { name, address, phone, email, description: description ?? '', enrollmentAlertDays },
    })
    revalidatePath(detailPath(centerId))
    revalidatePath(LIST_PATH)
    return { success: true, centerId }
  } else {
    const created = await db.center.create({
      data: { name, address, phone, email, description: description ?? '', enrollmentAlertDays },
    })
    revalidatePath(LIST_PATH)
    return { success: true, centerId: created.id }
  }
}

// ─────────────────────────────────────────
// Delete a center
// ─────────────────────────────────────────

export async function deleteCenter(id: string) {
  await db.center.delete({ where: { id } })
  revalidatePath(LIST_PATH)
  return { success: true }
}

// ─────────────────────────────────────────
// Save operating hours (replace all)
// ─────────────────────────────────────────

export async function saveOperatingHours(
  centerId: string,
  hours: { dayOfWeek: number; open: string; close: string; enabled: boolean }[]
) {
  await db.operatingHours.deleteMany({ where: { centerId } })

  const enabled = hours.filter(h => h.enabled)
  if (enabled.length > 0) {
    await db.operatingHours.createMany({
      data: enabled.map(h => ({
        centerId,
        dayOfWeek: h.dayOfWeek,
        open: h.open,
        close: h.close,
      })),
    })
  }

  revalidatePath(detailPath(centerId))
  return { success: true }
}

// ─────────────────────────────────────────
// Room management
// ─────────────────────────────────────────

export async function createRoom(_prevState: unknown, formData: FormData) {
  const centerId = (formData.get('centerId') as string)?.trim()
  const name     = (formData.get('name')     as string)?.trim()
  const capacity = Number(formData.get('capacity'))

  if (!centerId || !name) return { error: 'Centre et nom de salle obligatoires.' }
  if (isNaN(capacity) || capacity < 1) return { error: 'La capacité doit être d\'au moins 1.' }

  await db.room.create({ data: { centerId, name, capacity } })

  revalidatePath(detailPath(centerId))
  return { success: true }
}

export async function deleteRoom(id: string) {
  const room = await db.room.findUnique({ where: { id }, select: { centerId: true } })
  await db.room.delete({ where: { id } })
  if (room) revalidatePath(detailPath(room.centerId))
}

// ─────────────────────────────────────────
// Access plans (array of Cloudinary URLs)
// ─────────────────────────────────────────

export async function saveAccessPlans(centerId: string, urls: string[]) {
  await db.center.update({
    where: { id: centerId },
    data: { accessPlans: urls },
  })
  revalidatePath(detailPath(centerId))
  return { success: true }
}

// ─────────────────────────────────────────
// Save legal content (règlement + CGV)
// ─────────────────────────────────────────

export async function saveCenterLegal(
  centerId: string,
  data: { reglement: string; cgv: string }
) {
  await db.center.update({
    where: { id: centerId },
    data: {
      reglement: data.reglement.trim() || null,
      cgv:       data.cgv.trim()       || null,
    },
  })
  revalidatePath(detailPath(centerId))
  return { success: true }
}
