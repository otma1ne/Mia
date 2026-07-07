'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import type { FormationStatus, FormationType, TrainingNiveau } from '@prisma/client'

export interface FormationRow {
  id: string
  title: string
  categoryName: string
  type: FormationType
  status: FormationStatus
  niveau: TrainingNiveau | null
  codeRS: string | null
  duration: number | null
  maxStudents: number
  enrollmentCount: number
  moduleCount: number
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
      niveau: f.niveau,
      codeRS: f.codeRS,
      duration: f.duration,
      maxStudents: f.maxStudents,
      enrollmentCount: f._count.enrollments,
      moduleCount: f._count.modules,
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
  const priceRaw    = formData.get('price')     as string
  const durationRaw = formData.get('duration')  as string
  const programme   = (formData.get('programme') as string)?.trim() || undefined
  const niveauRaw   = (formData.get('niveau')   as string)?.trim() || undefined
  const codeRS      = (formData.get('codeRS')    as string)?.trim() || undefined

  if (!title || !description || !categoryId || !type) {
    return { error: 'Titre, description, catégorie et type sont requis.' }
  }
  if (isNaN(maxStudents) || maxStudents < 1) {
    return { error: 'La capacité doit être d\'au moins 1.' }
  }

  const VALID_NIVEAUX = ['START', 'PRO', 'EXPERT']
  const niveau = niveauRaw && VALID_NIVEAUX.includes(niveauRaw)
    ? (niveauRaw as TrainingNiveau)
    : undefined

  const price    = priceRaw    ? parseFloat(priceRaw)    : undefined
  const duration = durationRaw ? parseInt(durationRaw)   : undefined

  await db.formation.create({
    data: {
      title,
      description,
      categoryId,
      type,
      maxStudents,
      status: 'DRAFT',
      ...(niveau    !== undefined ? { niveau }    : {}),
      ...(codeRS    !== undefined ? { codeRS }    : {}),
      ...(price     !== undefined ? { price }     : {}),
      ...(duration  !== undefined ? { duration }  : {}),
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
  data: {
    price?: number | null
    duration?: number | null
    programme?: string | null
    niveau?: TrainingNiveau | null
    codeRS?: string | null
  }
) {
  await db.formation.update({
    where: { id },
    data: {
      price:     data.price     ?? null,
      duration:  data.duration  ?? null,
      programme: data.programme ?? null,
      niveau:    data.niveau    ?? null,
      codeRS:    data.codeRS != null ? (data.codeRS.trim() || null) : null,
    },
  })
  revalidatePath('/admin/formations')
}

// ─────────────────────────────────────────
// Duplicate formation
// ─────────────────────────────────────────

export async function duplicateFormation(id: string): Promise<{ error?: string }> {
  const source = await db.formation.findUnique({ where: { id } })
  if (!source) return { error: 'Formation introuvable.' }

  await db.formation.create({
    data: {
      title:       `Copie de ${source.title}`,
      description: source.description,
      categoryId:  source.categoryId,
      type:        source.type,
      status:      'DRAFT',
      maxStudents: source.maxStudents,
      thumbnail:   source.thumbnail,
      niveau:      source.niveau,
      codeRS:      source.codeRS,
      price:       source.price,
      duration:    source.duration,
      programme:   source.programme,
    },
  })

  revalidatePath('/admin/formations')
  return {}
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

// ─────────────────────────────────────────
// Compute formation date range from sessions
// ─────────────────────────────────────────

export async function getFormationDateRange(
  formationId: string
): Promise<{ startDate: Date | null; endDate: Date | null }> {
  const result = await db.session.aggregate({
    where: { formationId },
    _min: { date: true },
    _max: { date: true },
  })
  return {
    startDate: result._min.date ?? null,
    endDate:   result._max.date ?? null,
  }
}
