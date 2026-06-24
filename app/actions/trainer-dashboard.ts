'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { AttendanceStatus, ModuleStatus, ModuleType } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

// ─────────────────────────────────────────
// Private helper — get current trainer id
// ─────────────────────────────────────────

async function getTrainerId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const trainer = await db.trainer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!trainer) redirect('/unauthorized')
  return trainer.id
}

// ─────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────

export interface TrainerDashboardStats {
  totalModules: number
  publishedModules: number
  totalStudents: number
  completionRate: number
  upcomingSessions: {
    id: string
    moduleId: string
    moduleTitle: string
    date: Date
    startTime: string
    endTime: string
    roomName: string | null
  }[]
  modules: {
    id: string
    title: string
    type: ModuleType
    status: ModuleStatus
    enrollmentCount: number
  }[]
}

export async function getTrainerDashboardStats(): Promise<TrainerDashboardStats> {
  const trainerId = await getTrainerId()
  const now = new Date()
  const in7Days = addDays(now, 7)

  const [modules, upcomingSessions, enrollmentStats] = await Promise.all([
    db.module.findMany({
      where: { sessions: { some: { trainerId } } },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        _count: { select: { enrollments: true } },
      },
    }),
    db.session.findMany({
      where: {
        trainerId,
        date: { gte: now, lte: in7Days },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10,
      include: {
        module: { select: { title: true } },
        room: { select: { name: true } },
      },
    }),
    db.moduleEnrollment.findMany({
      where: { module: { sessions: { some: { trainerId } } } },
      select: { status: true },
    }),
  ])

  const totalStudents = enrollmentStats.filter(
    e => e.status === 'ACTIVE' || e.status === 'COMPLETED'
  ).length
  const completed = enrollmentStats.filter(e => e.status === 'COMPLETED').length
  const total = enrollmentStats.length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    totalModules: modules.length,
    publishedModules: modules.filter(m => m.status === 'PUBLISHED').length,
    totalStudents,
    completionRate,
    upcomingSessions: upcomingSessions.map(s => ({
      id: s.id,
      moduleId: s.moduleId,
      moduleTitle: s.module.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      roomName: s.room?.name ?? null,
    })),
    modules: modules.map(m => ({
      id: m.id,
      title: m.title,
      type: m.type,
      status: m.status,
      enrollmentCount: m._count.enrollments,
    })),
  }
}

// ─────────────────────────────────────────
// Trainer modules (paginated)
// ─────────────────────────────────────────

export interface TrainerModuleRow {
  id: string
  title: string
  formationTitle: string | null
  type: ModuleType
  status: ModuleStatus
  enrollmentCount: number
  duration: number
  orderIndex: number
}

export interface TrainerModulesResult {
  modules: TrainerModuleRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts: { all: number; PUBLISHED: number; DRAFT: number; COMPLETED: number; ARCHIVED: number }
}

export async function getTrainerModules({
  page = 1,
  pageSize = 10,
  search = '',
  status,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: ModuleStatus
} = {}): Promise<TrainerModulesResult> {
  const trainerId = await getTrainerId()

  const baseWhere = { sessions: { some: { trainerId } } }
  const where = {
    ...baseWhere,
    ...(status ? { status } : {}),
    ...(search.trim()
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {}),
  }

  const [total, modules, countsByStatus, allCount] = await Promise.all([
    db.module.count({ where }),
    db.module.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        duration: true,
        orderIndex: true,
        formation: { select: { title: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    db.module.groupBy({ by: ['status'], where: baseWhere, _count: { _all: true } }),
    db.module.count({ where: baseWhere }),
  ])

  const countMap = Object.fromEntries(
    countsByStatus.map(r => [r.status, r._count._all])
  ) as Partial<Record<ModuleStatus, number>>

  return {
    modules: modules.map(m => ({
      id: m.id,
      title: m.title,
      formationTitle: m.formation?.title ?? null,
      type: m.type,
      status: m.status,
      enrollmentCount: m._count.enrollments,
      duration: m.duration,
      orderIndex: m.orderIndex,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      all: allCount,
      PUBLISHED: countMap.PUBLISHED ?? 0,
      DRAFT: countMap.DRAFT ?? 0,
      COMPLETED: countMap.COMPLETED ?? 0,
      ARCHIVED: countMap.ARCHIVED ?? 0,
    },
  }
}

// ─────────────────────────────────────────
// Trainer students (paginated)
// ─────────────────────────────────────────

export interface TrainerStudentRow {
  userId: string
  name: string
  email: string
  moduleId: string
  moduleTitle: string
  enrollmentId: string
  enrollmentStatus: string
  progress: number
  enrolledAt: Date
}

export interface TrainerStudentsResult {
  students: TrainerStudentRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getTrainerStudents({
  page = 1,
  pageSize = 10,
  search = '',
}: {
  page?: number
  pageSize?: number
  search?: string
} = {}): Promise<TrainerStudentsResult> {
  const trainerId = await getTrainerId()

  const whereQuery = search.trim()
    ? {
        module: { sessions: { some: { trainerId } } },
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' as const } } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
          { module: { title: { contains: search, mode: 'insensitive' as const } } },
        ],
      }
    : { module: { sessions: { some: { trainerId } } } }

  const [total, enrollments] = await Promise.all([
    db.moduleEnrollment.count({ where: whereQuery }),
    db.moduleEnrollment.findMany({
      where: whereQuery,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { enrolledAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        module: { select: { title: true } },
      },
    }),
  ])

  return {
    students: enrollments.map(e => ({
      userId: e.userId,
      name: e.user.name,
      email: e.user.email,
      moduleId: e.moduleId,
      moduleTitle: e.module.title,
      enrollmentId: e.id,
      enrollmentStatus: e.status,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Trainer sessions for schedule
// ─────────────────────────────────────────

export interface TrainerSessionEvent {
  id: string
  moduleId: string
  moduleTitle: string
  date: Date
  startTime: string
  endTime: string
  roomName: string | null
  enrollmentCount: number
}

export async function getTrainerSessions({
  from,
  to,
}: {
  from: Date
  to: Date
}): Promise<TrainerSessionEvent[]> {
  const trainerId = await getTrainerId()

  const sessions = await db.session.findMany({
    where: {
      trainerId,
      date: { gte: from, lte: to },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    include: {
      room: { select: { name: true } },
      module: {
        select: {
          title: true,
          _count: { select: { enrollments: true } },
        },
      },
    },
  })

  return sessions.map(s => ({
    id: s.id,
    moduleId: s.moduleId,
    moduleTitle: s.module.title,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    roomName: s.room?.name ?? null,
    enrollmentCount: s.module._count.enrollments,
  }))
}

// ─────────────────────────────────────────
// Session options for attendance dropdown
// ─────────────────────────────────────────

export interface TrainerSessionOption {
  id: string
  moduleTitle: string
  date: Date
  startTime: string
  endTime: string
}

export async function getTrainerSessionOptions(): Promise<TrainerSessionOption[]> {
  const trainerId = await getTrainerId()
  const now = new Date()
  const from = subDays(now, 30)
  const to = addDays(now, 30)

  const sessions = await db.session.findMany({
    where: {
      trainerId,
      date: { gte: from, lte: to },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
    include: {
      module: { select: { title: true } },
    },
  })

  return sessions.map(s => ({
    id: s.id,
    moduleTitle: s.module.title,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
  }))
}

// ─────────────────────────────────────────
// Session details + students for attendance
// ─────────────────────────────────────────

export interface AttendanceStudentRow {
  enrollmentId: string
  userId: string
  name: string
  email: string
  attendanceStatus: AttendanceStatus | null
  attendanceNote: string | null
}

export interface SessionAttendanceData {
  sessionId: string
  moduleTitle: string
  date: Date
  startTime: string
  endTime: string
  students: AttendanceStudentRow[]
}

export async function getTrainerSessionsForAttendance(
  sessionId: string
): Promise<SessionAttendanceData | null> {
  const trainerId = await getTrainerId()

  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      module: {
        select: {
          title: true,
          enrollments: {
            where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
            include: {
              user: { select: { name: true, email: true } },
              attendances: {
                where: { sessionId },
                select: { status: true, note: true },
              },
            },
          },
        },
      },
    },
  })

  if (!session || session.trainerId !== trainerId) return null

  return {
    sessionId: session.id,
    moduleTitle: session.module.title,
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime,
    students: session.module.enrollments.map(e => ({
      enrollmentId: e.id,
      userId: e.userId,
      name: e.user.name,
      email: e.user.email,
      attendanceStatus: e.attendances[0]?.status ?? null,
      attendanceNote: e.attendances[0]?.note ?? null,
    })),
  }
}

// ─────────────────────────────────────────
// Save attendance records
// ─────────────────────────────────────────

export async function saveAttendance(
  sessionId: string,
  records: { enrollmentId: string; status: AttendanceStatus; note?: string }[]
): Promise<{ success: boolean; error?: string }> {
  const trainerId = await getTrainerId()

  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { trainerId: true },
  })
  if (!session || session.trainerId !== trainerId) {
    return { success: false, error: 'Non autorisé.' }
  }

  await Promise.all(
    records.map(r =>
      db.attendance.upsert({
        where: {
          moduleEnrollmentId_sessionId: {
            moduleEnrollmentId: r.enrollmentId,
            sessionId,
          },
        },
        create: {
          moduleEnrollmentId: r.enrollmentId,
          sessionId,
          status: r.status,
          note: r.note ?? null,
        },
        update: {
          status: r.status,
          note: r.note ?? null,
        },
      })
    )
  )

  revalidatePath('/trainer/attendance')
  return { success: true }
}

// ─────────────────────────────────────────
// Update student module progress & status
// ─────────────────────────────────────────

export async function updateStudentProgress(
  enrollmentId: string,
  progress: number,
  status?: string,
): Promise<{ success: boolean; error?: string }> {
  const trainerId = await getTrainerId()

  const enrollment = await db.moduleEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { moduleId: true },
  })
  if (!enrollment) return { success: false, error: 'Non autorisé.' }

  const hasSession = await db.session.findFirst({
    where: { moduleId: enrollment.moduleId, trainerId },
    select: { id: true },
  })
  if (!hasSession) {
    return { success: false, error: 'Non autorisé.' }
  }

  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)))

  await db.moduleEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: clampedProgress,
      ...(status ? { status: status as import('@prisma/client').EnrollmentStatus } : {}),
    },
  })

  revalidatePath('/trainer/students')
  return { success: true }
}
