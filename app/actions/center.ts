'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

const PATH = '/admin/center'

// ─────────────────────────────────────────
// Get center (first record, or null)
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
    return { error: 'Name, address, phone and email are required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return { error: 'Invalid email address.' }

  if (centerId) {
    await db.center.update({
      where: { id: centerId },
      data: { name, address, phone, email, description: description ?? '', enrollmentAlertDays },
    })
  } else {
    await db.center.create({
      data: { name, address, phone, email, description: description ?? '', enrollmentAlertDays },
    })
  }

  revalidatePath(PATH)
  return { success: true }
}

// ─────────────────────────────────────────
// Save operating hours (replace all)
// ─────────────────────────────────────────

export async function saveOperatingHours(
  centerId: string,
  hours: { dayOfWeek: number; open: string; close: string; enabled: boolean }[]
) {
  // Delete existing and re-create enabled ones
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

  revalidatePath(PATH)
  return { success: true }
}

// ─────────────────────────────────────────
// Room management
// ─────────────────────────────────────────

export async function createRoom(_prevState: unknown, formData: FormData) {
  const centerId = (formData.get('centerId') as string)?.trim()
  const name     = (formData.get('name')     as string)?.trim()
  const capacity = Number(formData.get('capacity'))

  if (!centerId || !name) return { error: 'Center and room name are required.' }
  if (isNaN(capacity) || capacity < 1) return { error: 'Capacity must be at least 1.' }

  await db.room.create({ data: { centerId, name, capacity } })

  revalidatePath(PATH)
  return { success: true }
}

export async function deleteRoom(id: string) {
  await db.room.delete({ where: { id } })
  revalidatePath(PATH)
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
  revalidatePath(PATH)
  return { success: true }
}
