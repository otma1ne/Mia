'use server'

import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { generatePassword } from '@/lib/generate-password'
import { sendTrainerWelcomeEmail } from '@/lib/email'
import { revalidatePath } from 'next/cache'

export interface TrainerRow {
  id: string          // Trainer.id
  userId: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  bio: string
  specializations: string[]
  credentials: string[]
  rating: number | null
  courseCount: number
  createdAt: Date
}

export interface TrainersResult {
  trainers: TrainerRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─────────────────────────────────────────
// Get paginated trainers list
// ─────────────────────────────────────────

export async function getTrainers({
  page = 1,
  pageSize = 10,
  search = '',
}: {
  page?: number
  pageSize?: number
  search?: string
} = {}): Promise<TrainersResult> {
  const userWhere = search.trim()
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const where = { user: userWhere }

  const [total, trainers] = await Promise.all([
    db.trainer.count({ where }),
    db.trainer.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
        _count: { select: { modules: true } },
      },
    }),
  ])

  return {
    trainers: trainers.map(t => ({
      id: t.id,
      userId: t.userId,
      name: t.user.name,
      email: t.user.email,
      phone: t.user.phone,
      avatar: t.user.avatar,
      bio: t.bio,
      specializations: t.specializations,
      credentials: t.credentials,
      rating: t.rating,
      courseCount: t._count.modules,
      createdAt: t.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Get a single trainer with full details
// ─────────────────────────────────────────

export async function getTrainer(id: string) {
  return db.trainer.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true, createdAt: true } },
      availability: { orderBy: { dayOfWeek: 'asc' } },
      modules: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  })
}

// ─────────────────────────────────────────
// Create trainer (also creates the User account)
// ─────────────────────────────────────────

export async function createTrainer(_prevState: unknown, formData: FormData) {
  const name            = (formData.get('name')            as string)?.trim()
  const email           = (formData.get('email')           as string)?.trim()
  const phone           = (formData.get('phone')           as string)?.trim() || null
  const bio             = (formData.get('bio')             as string)?.trim() || ''
  const specializations = (formData.get('specializations') as string)
    ?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const credentials     = (formData.get('credentials')     as string)
    ?.split(',').map(s => s.trim()).filter(Boolean) ?? []

  if (!name || !email) {
    return { error: 'Name and email are required.' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address.' }
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'A user with this email already exists.' }
  }

  const tempPassword = generatePassword()
  const hashed = await hashPassword(tempPassword)

  await db.user.create({
    data: {
      name,
      email,
      phone,
      password: hashed,
      role: 'TRAINER',
      trainer: {
        create: { bio, specializations, credentials },
      },
    },
  })

  revalidatePath('/admin/trainers')

  try {
    await sendTrainerWelcomeEmail(email, name, tempPassword)
  } catch (err) {
    console.error('[createTrainer] Failed to send welcome email:', err)
  }

  return { success: true }
}

// ─────────────────────────────────────────
// Delete a trainer (cascades to Trainer record via User)
// ─────────────────────────────────────────

export async function deleteTrainer(userId: string) {
  await db.user.delete({ where: { id: userId, role: 'TRAINER' } })
  revalidatePath('/admin/trainers')
}
