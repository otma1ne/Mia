'use server'

import { db } from '@/lib/db'
import { startOfMonth, subMonths } from 'date-fns'
import type { ModuleStatus } from '@prisma/client'

export interface DashboardStats {
  totalStudents: number
  totalStudentsPrev: number
  newEnrollments: number
  newEnrollmentsPrev: number
  activeModules: number
  activeModulesPrev: number
  completionRate: number          // 0–100
  completionRatePrev: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now       = new Date()
  const thisMonth = startOfMonth(now)
  const lastMonth = startOfMonth(subMonths(now, 1))

  const [
    totalStudents,
    totalStudentsPrev,
    newEnrollments,
    newEnrollmentsPrev,
    activeModules,
    activeModulesPrev,
    completedEnrollments,
    totalEnrollments,
    completedEnrollmentsPrev,
    totalEnrollmentsPrev,
  ] = await Promise.all([
    // Students registered up to now vs up to last month start
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'STUDENT', createdAt: { lt: thisMonth } } }),

    // Formation enrollments created this month vs last month
    db.formationEnrollment.count({ where: { enrolledAt: { gte: thisMonth } } }),
    db.formationEnrollment.count({ where: { enrolledAt: { gte: lastMonth, lt: thisMonth } } }),

    // Published modules now vs at start of this month
    db.module.count({ where: { status: 'PUBLISHED' } }),
    db.module.count({ where: { status: 'PUBLISHED', createdAt: { lt: thisMonth } } }),

    // Completion rate: COMPLETED / total module enrollments
    db.moduleEnrollment.count({ where: { status: 'COMPLETED' } }),
    db.moduleEnrollment.count(),
    db.moduleEnrollment.count({ where: { status: 'COMPLETED', updatedAt: { lt: thisMonth } } }),
    db.moduleEnrollment.count({ where: { updatedAt: { lt: thisMonth } } }),
  ])

  const completionRate     = totalEnrollments     > 0 ? (completedEnrollments     / totalEnrollments)     * 100 : 0
  const completionRatePrev = totalEnrollmentsPrev > 0 ? (completedEnrollmentsPrev / totalEnrollmentsPrev) * 100 : 0

  return {
    totalStudents,
    totalStudentsPrev,
    newEnrollments,
    newEnrollmentsPrev,
    activeModules,
    activeModulesPrev,
    completionRate:     Math.round(completionRate),
    completionRatePrev: Math.round(completionRatePrev),
  }
}

export interface RecentModuleRow {
  id: string
  title: string
  categoryName: string
  status: ModuleStatus
  enrollmentCount: number
  trainerName: string
}

export async function getRecentModules(): Promise<RecentModuleRow[]> {
  const modules = await db.module.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      formation: { include: { category: { select: { name: true } } } },
      trainer: { include: { user: { select: { name: true } } } },
      _count: { select: { enrollments: true } },
    },
  })
  return modules.map(m => ({
    id: m.id,
    title: m.title,
    categoryName: m.formation.category.name,
    status: m.status,
    enrollmentCount: m._count.enrollments,
    trainerName: m.trainer?.user.name ?? '—',
  }))
}
