'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────

async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user
}

// Verify the module belongs to this trainer (or user is admin)
async function assertModuleOwnership(moduleId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role === 'ADMIN') return
  const trainer = await db.trainer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!trainer) redirect('/unauthorized')
  const assigned = await db.session.findFirst({
    where: { moduleId, trainerId: trainer.id },
    select: { id: true },
  })
  if (!assigned) redirect('/unauthorized')
}

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface MaterialRow {
  id: string
  title: string
  url: string
  type: string
}

// ─────────────────────────────────────────
// Read
// ─────────────────────────────────────────

export async function getModuleMaterials(moduleId: string): Promise<MaterialRow[]> {
  const user = await getSessionUser()
  // Allow admins or trainers assigned to the module
  if (user.role !== 'ADMIN') {
    const trainer = await db.trainer.findUnique({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!trainer) redirect('/unauthorized')
    const assigned = await db.session.findFirst({
      where: { moduleId, trainerId: trainer.id },
      select: { id: true },
    })
    if (!assigned) redirect('/unauthorized')
  }
  return db.moduleMaterial.findMany({
    where: { moduleId },
    orderBy: { id: 'asc' },
    select: { id: true, title: true, url: true, type: true },
  })
}

// ─────────────────────────────────────────
// Create
// ─────────────────────────────────────────

export async function addModuleMaterial(_prevState: unknown, formData: FormData) {
  const moduleId = (formData.get('moduleId') as string)?.trim()
  const title    = (formData.get('title')    as string)?.trim()
  const url      = (formData.get('url')      as string)?.trim()
  const type     = (formData.get('type')     as string)?.trim()

  if (!moduleId || !title || !url || !type) {
    return { error: 'Tous les champs sont requis.' }
  }

  const urlPattern = /^https?:\/\/.+/
  if (!urlPattern.test(url)) {
    return { error: "L'URL doit commencer par http:// ou https://" }
  }

  await assertModuleOwnership(moduleId)

  const module = await db.module.findUnique({
    where: { id: moduleId },
    select: { formationId: true },
  })

  await db.moduleMaterial.create({
    data: { moduleId, title, url, type },
  })

  revalidatePath('/trainer/modules')
  if (module) revalidatePath(`/student/formations/${module.formationId}`)
  return { success: true }
}

// ─────────────────────────────────────────
// Delete
// ─────────────────────────────────────────

export async function deleteModuleMaterial(materialId: string) {
  const material = await db.moduleMaterial.findUnique({
    where: { id: materialId },
    select: { moduleId: true },
  })
  if (!material) return

  await assertModuleOwnership(material.moduleId)
  await db.moduleMaterial.delete({ where: { id: materialId } })
  revalidatePath('/trainer/modules')
}

// ─────────────────────────────────────────
// Mark material complete (student)
// ─────────────────────────────────────────

export async function markMaterialComplete(materialId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  await db.materialProgress.upsert({
    where: { userId_materialId: { userId, materialId } },
    create: { userId, materialId },
    update: { completedAt: new Date() },
  })

  revalidatePath('/student/formations')
}
