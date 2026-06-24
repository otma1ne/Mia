'use server'

import { db } from '@/lib/db'
import {
  startOfMonth, startOfWeek, startOfYear,
  subMonths, subWeeks, subYears,
  format,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ModuleStatus } from '@prisma/client'

// ─────────────────────────────────────────
// Revenue dashboard
// Source: ACCEPTED inscriptions × formation.price
// ─────────────────────────────────────────

export interface MonthlyRevenuePoint {
  month: string   // e.g. "Jan 25"
  revenue: number
  count: number   // number of accepted inscriptions
}

export interface RevenueDashboard {
  revenueThisWeek: number
  revenueLastWeek: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueThisYear: number
  revenueLastYear: number
  inscriptionsThisMonth: number
  inscriptionsLastMonth: number
  monthly: MonthlyRevenuePoint[]  // last 12 months, oldest first
}

export async function getRevenueDashboard(): Promise<RevenueDashboard> {
  const now = new Date()

  const weekStart     = startOfWeek(now, { weekStartsOn: 1 })
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
  const monthStart    = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const yearStart     = startOfYear(now)
  const lastYearStart = startOfYear(subYears(now, 1))

  // Fetch all ACCEPTED inscriptions from the last 25 months + their formation price
  const since = startOfMonth(subMonths(now, 24))
  const inscriptions = await db.inscription.findMany({
    where: {
      status: 'ACCEPTED',
      signedAt: { gte: since },
    },
    select: {
      signedAt: true,
      formation: { select: { price: true } },
    },
  })

  function sumRevenue(items: typeof inscriptions) {
    return items.reduce((acc, i) => acc + (i.formation.price ?? 0), 0)
  }

  const thisWeek      = inscriptions.filter(i => i.signedAt! >= weekStart)
  const lastWeek      = inscriptions.filter(i => i.signedAt! >= lastWeekStart && i.signedAt! < weekStart)
  const thisMonth     = inscriptions.filter(i => i.signedAt! >= monthStart)
  const lastMonth     = inscriptions.filter(i => i.signedAt! >= lastMonthStart && i.signedAt! < monthStart)
  const thisYear      = inscriptions.filter(i => i.signedAt! >= yearStart)
  const lastYear      = inscriptions.filter(i => i.signedAt! >= lastYearStart && i.signedAt! < yearStart)

  // Build last 12 months chart data
  const monthly: MonthlyRevenuePoint[] = []
  for (let i = 11; i >= 0; i--) {
    const mStart = startOfMonth(subMonths(now, i))
    const mEnd   = startOfMonth(subMonths(now, i - 1))
    const inMonth = inscriptions.filter(
      ins => ins.signedAt! >= mStart && ins.signedAt! < mEnd
    )
    monthly.push({
      month:   format(mStart, 'MMM yy', { locale: fr }),
      revenue: Math.round(sumRevenue(inMonth)),
      count:   inMonth.length,
    })
  }

  return {
    revenueThisWeek:       Math.round(sumRevenue(thisWeek)),
    revenueLastWeek:       Math.round(sumRevenue(lastWeek)),
    revenueThisMonth:      Math.round(sumRevenue(thisMonth)),
    revenueLastMonth:      Math.round(sumRevenue(lastMonth)),
    revenueThisYear:       Math.round(sumRevenue(thisYear)),
    revenueLastYear:       Math.round(sumRevenue(lastYear)),
    inscriptionsThisMonth: thisMonth.length,
    inscriptionsLastMonth: lastMonth.length,
    monthly,
  }
}

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
      _count: { select: { enrollments: true } },
    },
  })
  return modules.map(m => ({
    id: m.id,
    title: m.title,
    categoryName: m.formation.category.name,
    status: m.status,
    enrollmentCount: m._count.enrollments,
    trainerName: '—',
  }))
}
