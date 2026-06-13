'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { FormationStatus, FormationType } from '@prisma/client'

export interface FormationRow {
  id: string
  title: string
  categoryName: string
  type: FormationType
  status: FormationStatus
  maxStudents: number
  enrollmentCount: number
  moduleCount: number
  startDate: Date
  endDate: Date
  createdAt: Date
}

export interface FormationsResult {
  formations: FormationRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts: { all: number; PUBLISHED: number; DRAFT: number; ARCHIVED: number; COMPLETED: number }
}

// ─────────────────────────────────────────
// Get paginated formations list
// ─────────────────────────────────────────

export async function getFormations({
  page = 1,
  pageSize = 10,
  search = '',
  status,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: FormationStatus
} = {}): Promise<FormationsResult> {
  const where = {
    ...(status ? { status } : {}),
    ...(search.trim()
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {}),
  }

  const [total, formations, countsByStatus] = await Promise.all([
    db.formation.count({ where }),
    db.formation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
    db.formation.groupBy({ by: ['status'], _count: { _all: true } }),
  ])

  const countMap = Object.fromEntries(
    countsByStatus.map(r => [r.status, r._count._all])
  ) as Record<FormationStatus, number>

  return {
    formations: formations.map(f => ({
      id: f.id,
      title: f.title,
      categoryName: f.category.name,
      type: f.type,
      status: f.status,
      maxStudents: f.maxStudents,
      enrollmentCount: f._count.enrollments,
      moduleCount: f._count.modules,
      startDate: f.startDate,
      endDate: f.endDate,
      createdAt: f.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      all: await db.formation.count(),
      PUBLISHED: countMap.PUBLISHED ?? 0,
      DRAFT: countMap.DRAFT ?? 0,
      ARCHIVED: countMap.ARCHIVED ?? 0,
      COMPLETED: countMap.COMPLETED ?? 0,
    },
  }
}

// ─────────────────────────────────────────
// Get a single formation with full details
// ─────────────────────────────────────────

export async function getFormation(id: string) {
  return db.formation.findUnique({
    where: { id },
    include: {
      category: { select: { name: true } },
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          trainer: { include: { user: { select: { name: true } } } },
          _count: { select: { enrollments: true } },
        },
      },
      _count: { select: { enrollments: true, modules: true } },
    },
  })
}

// ─────────────────────────────────────────
// Lookup data for create form
// ─────────────────────────────────────────

export async function getFormationFormData() {
  return db.category.findMany({ orderBy: { name: 'asc' } })
}

// ─────────────────────────────────────────
// Create formation
// ─────────────────────────────────────────

export async function createFormation(_prevState: unknown, formData: FormData) {
  const title       = (formData.get('title')       as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const categoryId  = (formData.get('categoryId')  as string)?.trim()
  const type        = (formData.get('type')        as FormationType)
  const maxStudents = Number(formData.get('maxStudents'))
  const startDate   = formData.get('startDate') as string
  const endDate     = formData.get('endDate')   as string
  const priceRaw    = formData.get('price')     as string
  const durationRaw = formData.get('duration')  as string
  const programme   = (formData.get('programme') as string)?.trim() || undefined

  if (!title || !description || !categoryId || !type) {
    return { error: 'Titre, description, catégorie et type sont requis.' }
  }
  if (!startDate || !endDate) {
    return { error: 'Les dates de début et de fin sont requises.' }
  }
  if (new Date(startDate) >= new Date(endDate)) {
    return { error: 'La date de fin doit être après la date de début.' }
  }
  if (isNaN(maxStudents) || maxStudents < 1) {
    return { error: 'La capacité doit être d\'au moins 1.' }
  }

  const price    = priceRaw    ? parseFloat(priceRaw)    : undefined
  const duration = durationRaw ? parseInt(durationRaw)   : undefined

  await db.formation.create({
    data: {
      title,
      description,
      categoryId,
      type,
      maxStudents,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'DRAFT',
      ...(price    !== undefined ? { price }    : {}),
      ...(duration !== undefined ? { duration } : {}),
      ...(programme               ? { programme } : {}),
    },
  })

  revalidatePath('/admin/formations')
  return { success: true }
}

// ─────────────────────────────────────────
// Update formation details (price, duration, programme)
// ─────────────────────────────────────────

export async function updateFormationDetails(
  id: string,
  data: { price?: number | null; duration?: number | null; programme?: string | null }
) {
  await db.formation.update({
    where: { id },
    data: {
      price:     data.price     ?? null,
      duration:  data.duration  ?? null,
      programme: data.programme ?? null,
    },
  })
  revalidatePath('/admin/formations')
}

// ─────────────────────────────────────────
// Update formation status
// ─────────────────────────────────────────

export async function updateFormationStatus(id: string, status: FormationStatus) {
  await db.formation.update({ where: { id }, data: { status } })
  revalidatePath('/admin/formations')
}

// ─────────────────────────────────────────
// Delete formation
// ─────────────────────────────────────────

export async function deleteFormation(id: string) {
  await db.formation.delete({ where: { id } })
  revalidatePath('/admin/formations')
}
