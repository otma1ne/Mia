'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface CategoryRow {
  id: string
  name: string
  description: string | null
  formationCount: number
  createdAt: Date
}

// ─────────────────────────────────────────
// List all categories
// ─────────────────────────────────────────

export async function getCategories(): Promise<CategoryRow[]> {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { formations: true } } },
  })

  return categories.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    formationCount: c._count.formations,
    createdAt: c.createdAt,
  }))
}

// ─────────────────────────────────────────
// Create
// ─────────────────────────────────────────

export async function createCategory(_: unknown, formData: FormData) {
  const name        = formData.get('name')?.toString().trim() ?? ''
  const description = formData.get('description')?.toString().trim() ?? ''

  if (!name) return { success: false, error: 'Le nom est requis.' }

  const exists = await db.category.findUnique({ where: { name } })
  if (exists) return { success: false, error: 'Une catégorie avec ce nom existe déjà.' }

  await db.category.create({ data: { name, description: description || null } })

  revalidatePath('/admin/categories')
  revalidatePath('/courses')
  revalidatePath('/')

  return { success: true }
}

// ─────────────────────────────────────────
// Update
// ─────────────────────────────────────────

export async function updateCategory(_: unknown, formData: FormData) {
  const id          = formData.get('id')?.toString() ?? ''
  const name        = formData.get('name')?.toString().trim() ?? ''
  const description = formData.get('description')?.toString().trim() ?? ''

  if (!id)   return { success: false, error: 'ID manquant.' }
  if (!name) return { success: false, error: 'Le nom est requis.' }

  const conflict = await db.category.findFirst({ where: { name, NOT: { id } } })
  if (conflict) return { success: false, error: 'Une catégorie avec ce nom existe déjà.' }

  await db.category.update({
    where: { id },
    data: { name, description: description || null },
  })

  revalidatePath('/admin/categories')
  revalidatePath('/courses')
  revalidatePath('/')

  return { success: true }
}

// ─────────────────────────────────────────
// Delete
// ─────────────────────────────────────────

export async function deleteCategory(_: unknown, formData: FormData) {
  const id = formData.get('id')?.toString() ?? ''
  if (!id) return { success: false, error: 'ID manquant.' }

  const category = await db.category.findUnique({
    where: { id },
    include: { _count: { select: { formations: true } } },
  })

  if (!category) return { success: false, error: 'Catégorie introuvable.' }

  if (category._count.formations > 0) {
    return {
      success: false,
      error: `Impossible de supprimer : ${category._count.formations} formation(s) utilisent cette catégorie.`,
    }
  }

  await db.category.delete({ where: { id } })

  revalidatePath('/admin/categories')
  revalidatePath('/courses')
  revalidatePath('/')

  return { success: true }
}
