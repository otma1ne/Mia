'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ModuleStatus, ModuleType } from '@prisma/client'

// ─────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') redirect('/unauthorized')
  return session
}

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session
}

// ─────────────────────────────────────────
// Row types
// ─────────────────────────────────────────

export interface ModuleRow {
  id: string
  title: string
  description: string
  orderIndex: number
  type: ModuleType
  status: ModuleStatus
  videoUrl: string | null
  duration: number
  formationId: string
  enrollmentCount: number
  materialCount: number
  sessionCount: number
  createdAt: Date
}

// ─────────────────────────────────────────
// Read — list & detail
// ─────────────────────────────────────────

export async function getModulesForFormation(formationId: string): Promise<ModuleRow[]> {
  const modules = await db.module.findMany({
    where: { formationId },
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: { select: { enrollments: true, materials: true, sessions: true } },
    },
  })

  return modules.map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    orderIndex: m.orderIndex,
    type: m.type,
    status: m.status,
    videoUrl: m.videoUrl,
    duration: m.duration,
    formationId: m.formationId,
    enrollmentCount: m._count.enrollments,
    materialCount: m._count.materials,
    sessionCount: m._count.sessions,
    createdAt: m.createdAt,
  }))
}

export async function getModule(id: string) {
  return db.module.findUnique({
    where: { id },
    include: {
      formation: { select: { id: true, title: true } },
      materials: { orderBy: { id: 'asc' } },
      sessions: {
        orderBy: { date: 'asc' },
        include: { room: { select: { name: true } } },
      },
      _count: { select: { enrollments: true, materials: true, sessions: true } },
    },
  })
}

export async function getModuleFormData() {
  return { trainers: [] as { id: string; user: { name: string } }[] }
}

// ─────────────────────────────────────────
// Create
// ─────────────────────────────────────────

export async function createModule(_prevState: unknown, formData: FormData) {
  await requireAdmin()

  const formationId = (formData.get('formationId') as string)?.trim()
  const title       = (formData.get('title')       as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const type        = (formData.get('type')        as ModuleType)
  const videoUrl    = (formData.get('videoUrl')    as string)?.trim() || null
  const duration    = Number(formData.get('duration')) || 0

  if (!formationId || !title || !description || !type) {
    return { error: 'Formation, titre, description et type sont requis.' }
  }

  // Auto-assign next orderIndex
  const last = await db.module.findFirst({
    where: { formationId },
    orderBy: { orderIndex: 'desc' },
    select: { orderIndex: true },
  })
  const orderIndex = (last?.orderIndex ?? -1) + 1

  await db.module.create({
    data: {
      formationId,
      title,
      description,
      type,
      status: 'DRAFT',
      videoUrl,
      duration,
      orderIndex,
    },
  })

  revalidatePath(`/admin/formations/${formationId}`)
  revalidatePath('/admin/formations')
  return { success: true }
}

// ─────────────────────────────────────────
// Update
// ─────────────────────────────────────────

export interface ModuleUpdateData {
  title?: string
  description?: string
  type?: ModuleType
  videoUrl?: string | null
  duration?: number
}

export async function updateModule(id: string, data: ModuleUpdateData) {
  await requireAdmin()

  const module = await db.module.findUnique({
    where: { id },
    select: { formationId: true },
  })
  if (!module) return { error: 'Module introuvable.' }

  await db.module.update({
    where: { id },
    data: {
      ...(data.title       !== undefined ? { title: data.title }             : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.type        !== undefined ? { type: data.type }               : {}),
      ...(data.videoUrl    !== undefined ? { videoUrl: data.videoUrl }       : {}),
      ...(data.duration    !== undefined ? { duration: data.duration }       : {}),
    },
  })

  revalidatePath(`/admin/formations/${module.formationId}`)
  return { success: true }
}

export async function updateModuleStatus(id: string, status: ModuleStatus) {
  await requireAdmin()
  const module = await db.module.findUnique({ where: { id }, select: { formationId: true } })
  if (!module) return
  await db.module.update({ where: { id }, data: { status } })
  revalidatePath(`/admin/formations/${module.formationId}`)
}

// ─────────────────────────────────────────
// Reorder (↑ / ↓ buttons)
// ─────────────────────────────────────────

export async function reorderModules(formationId: string, orderedIds: string[]) {
  await requireAdmin()

  await Promise.all(
    orderedIds.map((moduleId, index) =>
      db.module.update({
        where: { id: moduleId },
        data: { orderIndex: index },
      })
    )
  )

  revalidatePath(`/admin/formations/${formationId}`)
  return { success: true }
}

// ─────────────────────────────────────────
// Delete
// ─────────────────────────────────────────

export async function deleteModule(id: string) {
  await requireAdmin()
  const module = await db.module.findUnique({ where: { id }, select: { formationId: true } })
  if (!module) return
  await db.module.delete({ where: { id } })
  revalidatePath(`/admin/formations/${module.formationId}`)
  revalidatePath('/admin/formations')
}

// ─────────────────────────────────────────
// Sequential lock gate (student access)
// ─────────────────────────────────────────

export async function getStudentModuleAccess(
  userId: string,
  moduleId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const module = await db.module.findUnique({
    where: { id: moduleId },
    select: { id: true, formationId: true, orderIndex: true, title: true, status: true },
  })
  if (!module) return { allowed: false, reason: 'Module introuvable.' }
  if (module.status !== 'PUBLISHED') return { allowed: false, reason: 'Module non publié.' }

  // First module is always accessible
  if (module.orderIndex === 0) return { allowed: true }

  // Find the previous module (orderIndex - 1)
  const prev = await db.module.findFirst({
    where: { formationId: module.formationId, orderIndex: module.orderIndex - 1 },
    select: { id: true, title: true },
  })
  if (!prev) return { allowed: true } // no previous → accessible

  const prevDone = await db.moduleEnrollment.findFirst({
    where: { userId, moduleId: prev.id, completedAt: { not: null } },
  })

  return {
    allowed: !!prevDone,
    reason: prevDone ? undefined : `Terminez "${prev.title}" avant d'accéder à ce module.`,
  }
}

// ─────────────────────────────────────────
// Mark module complete (student)
// ─────────────────────────────────────────

export async function markModuleComplete(moduleId: string) {
  const session = await requireAuth()
  const userId = session.user.id

  // Check sequential access
  const access = await getStudentModuleAccess(userId, moduleId)
  if (!access.allowed) return { error: access.reason }

  const moduleEnrollment = await db.moduleEnrollment.findUnique({
    where: { userId_moduleId: { userId, moduleId } },
    select: { id: true, formationEnrollmentId: true, completedAt: true },
  })
  if (!moduleEnrollment) return { error: 'Inscription au module introuvable.' }
  if (moduleEnrollment.completedAt) return { success: true } // already completed

  // Mark this module as complete
  await db.moduleEnrollment.update({
    where: { id: moduleEnrollment.id },
    data: { completedAt: new Date(), status: 'COMPLETED', progress: 100 },
  })

  // Recompute FormationEnrollment.progress
  const formationEnrollmentId = moduleEnrollment.formationEnrollmentId
  const [totalModules, completedModules] = await Promise.all([
    db.moduleEnrollment.count({ where: { formationEnrollmentId } }),
    db.moduleEnrollment.count({
      where: { formationEnrollmentId, completedAt: { not: null } },
    }),
  ])

  const newProgress = totalModules > 0
    ? Math.round((completedModules / totalModules) * 100)
    : 0

  await db.formationEnrollment.update({
    where: { id: formationEnrollmentId },
    data: { progress: newProgress, completedAt: newProgress === 100 ? new Date() : undefined },
  })

  revalidatePath(`/student/formations`)
  return { success: true }
}
