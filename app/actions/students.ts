'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export interface StudentRow {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  createdAt: Date
  totalEnrollments: number
  activeEnrollments: number
}

export interface StudentsResult {
  students: StudentRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─────────────────────────────────────────
// Get paginated students list
// ─────────────────────────────────────────

export async function getStudents({
  page = 1,
  pageSize = 10,
  search = '',
}: {
  page?: number
  pageSize?: number
  search?: string
} = {}): Promise<StudentsResult> {
  const where = {
    role: 'STUDENT' as const,
    ...(search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { formationEnrollments: true } },
        formationEnrollments: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    }),
  ])

  return {
    students: users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar,
      createdAt: u.createdAt,
      totalEnrollments: u._count.formationEnrollments,
      activeEnrollments: u.formationEnrollments.length,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Get a single student with full details
// ─────────────────────────────────────────

export async function getStudent(id: string) {
  return db.user.findUnique({
    where: { id, role: 'STUDENT' },
    include: {
      formationEnrollments: {
        orderBy: { enrolledAt: 'desc' },
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
            },
          },
        },
      },
    },
  })
}

// ─────────────────────────────────────────
// Delete a student
// ─────────────────────────────────────────

export async function deleteStudent(id: string) {
  await db.user.delete({ where: { id, role: 'STUDENT' } })
  revalidatePath('/admin/students')
}
