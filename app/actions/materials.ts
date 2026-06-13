'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────
// Mark material as completed by student
// ─────────────────────────────────────────

export async function markMaterialCompleted(materialId: string, formationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Authentification requise.' }

  try {
    // Verify material exists
    const material = await db.moduleMaterial.findUnique({
      where: { id: materialId },
      select: { id: true, moduleId: true },
    })

    if (!material) return { error: 'Matériel introuvable.' }

    // Verify student is enrolled in the formation
    const enrollment = await db.formationEnrollment.findUnique({
      where: { userId_formationId: { userId: session.user.id, formationId } },
      select: { id: true },
    })

    if (!enrollment) return { error: 'Non inscrit à cette formation.' }

    // Check if already completed
    const existing = await db.materialProgress.findUnique({
      where: { userId_materialId: { userId: session.user.id, materialId } },
    })

    if (existing) {
      return { success: true, alreadyCompleted: true }
    }

    // Mark as completed
    await db.materialProgress.create({
      data: {
        userId: session.user.id,
        materialId,
        completedAt: new Date(),
      },
    })

    // Update module progress
    const module = await db.module.findUnique({
      where: { id: material.moduleId },
      include: {
        materials: { select: { id: true } },
      },
    })

    if (module && module.materials.length > 0) {
      const completedCount = await db.materialProgress.count({
        where: {
          userId: session.user.id,
          materialId: { in: module.materials.map((m) => m.id) },
        },
      })

      const progress = Math.round((completedCount / module.materials.length) * 100)

      // Update module enrollment progress
      await db.moduleEnrollment.updateMany({
        where: {
          userId: session.user.id,
          moduleId: material.moduleId,
        },
        data: { progress },
      })

      // If all materials completed, auto-complete the module
      if (completedCount === module.materials.length) {
        await db.moduleEnrollment.updateMany({
          where: {
            userId: session.user.id,
            moduleId: material.moduleId,
          },
          data: { completedAt: new Date() },
        })
      }
    }

    revalidatePath(`/student/formations/${formationId}`)
    return { success: true, alreadyCompleted: false }
  } catch (error) {
    console.error('[markMaterialCompleted] Error:', error)
    return { error: 'Erreur lors de la mise à jour.' }
  }
}

// ─────────────────────────────────────────
// Check if material is completed
// ─────────────────────────────────────────

export async function isMaterialCompleted(materialId: string): Promise<boolean> {
  const session = await auth()
  if (!session?.user?.id) return false

  try {
    const progress = await db.materialProgress.findUnique({
      where: { userId_materialId: { userId: session.user.id, materialId } },
    })
    return !!progress
  } catch {
    return false
  }
}

// ─────────────────────────────────────────
// Get material completion status for a module
// ─────────────────────────────────────────

export async function getModuleMaterialProgress(
  moduleId: string,
  formationId: string
): Promise<{
  totalMaterials: number
  completedMaterials: number
  progress: number
  completedIds: string[]
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    // Verify enrollment
    const enrollment = await db.formationEnrollment.findUnique({
      where: { userId_formationId: { userId: session.user.id, formationId } },
      select: { id: true },
    })

    if (!enrollment) return null

    const module = await db.module.findUnique({
      where: { id: moduleId },
      include: { materials: { select: { id: true } } },
    })

    if (!module) return null

    const completed = await db.materialProgress.findMany({
      where: {
        userId: session.user.id,
        materialId: { in: module.materials.map((m) => m.id) },
      },
      select: { materialId: true },
    })

    const completedIds = completed.map((c) => c.materialId)
    const totalMaterials = module.materials.length
    const completedMaterials = completedIds.length
    const progress = totalMaterials > 0 ? Math.round((completedMaterials / totalMaterials) * 100) : 0

    return {
      totalMaterials,
      completedMaterials,
      progress,
      completedIds,
    }
  } catch (error) {
    console.error('[getModuleMaterialProgress] Error:', error)
    return null
  }
}
