'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { EnrollmentStatus, FormationType, FormationStatus, AttendanceStatus, ModuleType, ModuleStatus } from '@prisma/client'
import { addDays } from 'date-fns'

// ─────────────────────────────────────────
// Private helper — get current student userId
// ─────────────────────────────────────────

async function getStudentId(): Promise<string> {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return session.user.id
}

// ─────────────────────────────────────────
// Dashboard stats
// ─────────────────────────────────────────

export interface StudentDashboardStats {
  enrolledFormations: number
  activeFormations: number
  completedFormations: number
  upcomingSessions: {
    id: string
    moduleId: string
    moduleTitle: string
    date: Date
    startTime: string
    endTime: string
    roomName: string | null
  }[]
  recentEnrollments: {
    id: string
    formationId: string
    formationTitle: string
    status: EnrollmentStatus
    progress: number
    enrolledAt: Date
  }[]
}

export async function getStudentDashboardStats(): Promise<StudentDashboardStats> {
  const userId = await getStudentId()
  const now = new Date()
  const in7Days = addDays(now, 7)

  const [enrollments, upcomingSessions] = await Promise.all([
    db.formationEnrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        formation: {
          select: {
            title: true,
          },
        },
      },
    }),
    db.session.findMany({
      where: {
        module: {
          enrollments: {
            some: { userId, status: 'ACTIVE' },
          },
        },
        date: { gte: now, lte: in7Days },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10,
      include: {
        module: { select: { title: true } },
        room: { select: { name: true } },
      },
    }),
  ])

  return {
    enrolledFormations: enrollments.length,
    activeFormations: enrollments.filter(e => e.status === 'ACTIVE').length,
    completedFormations: enrollments.filter(e => e.status === 'COMPLETED').length,
    upcomingSessions: upcomingSessions.map(s => ({
      id: s.id,
      moduleId: s.moduleId,
      moduleTitle: s.module.title,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      roomName: s.room?.name ?? null,
    })),
    recentEnrollments: enrollments.slice(0, 5).map(e => ({
      id: e.id,
      formationId: e.formationId,
      formationTitle: e.formation.title,
      status: e.status,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
    })),
  }
}

// ─────────────────────────────────────────
// Student enrollments (paginated)
// ─────────────────────────────────────────

export interface StudentEnrollmentRow {
  id: string
  formationId: string
  formationTitle: string
  categoryName: string
  type: FormationType
  status: EnrollmentStatus
  progress: number
  grade: number | null
  enrolledAt: Date
}

export interface StudentEnrollmentsResult {
  enrollments: StudentEnrollmentRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getStudentEnrollments({
  page = 1,
  pageSize = 10,
  search = '',
  status,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: EnrollmentStatus
} = {}): Promise<StudentEnrollmentsResult> {
  const userId = await getStudentId()

  const where = {
    userId,
    ...(status ? { status } : {}),
    ...(search.trim()
      ? { formation: { title: { contains: search, mode: 'insensitive' as const } } }
      : {}),
  }

  const [total, enrollments] = await Promise.all([
    db.formationEnrollment.count({ where }),
    db.formationEnrollment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { enrolledAt: 'desc' },
      include: {
        formation: {
          select: {
            title: true,
            type: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
  ])

  return {
    enrollments: enrollments.map(e => ({
      id: e.id,
      formationId: e.formationId,
      formationTitle: e.formation.title,
      categoryName: e.formation.category.name,
      type: e.formation.type,
      status: e.status,
      progress: e.progress,
      grade: e.grade,
      enrolledAt: e.enrolledAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Browsable formations (PUBLISHED)
// ─────────────────────────────────────────

export interface BrowsableFormationRow {
  id: string
  title: string
  description: string
  categoryName: string
  type: FormationType
  enrollmentCount: number
  maxStudents: number
  moduleCount: number
  isEnrolled: boolean
}

export interface BrowsableFormationsResult {
  formations: BrowsableFormationRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getStudentBrowsableFormations({
  page = 1,
  pageSize = 12,
  search = '',
  type,
}: {
  page?: number
  pageSize?: number
  search?: string
  type?: FormationType
} = {}): Promise<BrowsableFormationsResult> {
  const userId = await getStudentId()

  const enrolled = await db.formationEnrollment.findMany({
    where: { userId, status: { in: ['ACTIVE', 'COMPLETED'] } },
    select: { formationId: true },
  })
  const enrolledIds = enrolled.map(e => e.formationId)

  const where = {
    status: 'PUBLISHED' as const,
    ...(type ? { type } : {}),
    ...(search.trim()
      ? { title: { contains: search, mode: 'insensitive' as const } }
      : {}),
  }

  const [total, formations] = await Promise.all([
    db.formation.count({ where }),
    db.formation.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'asc' },
      include: {
        category: { select: { name: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
  ])

  return {
    formations: formations.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      categoryName: f.category.name,
      type: f.type,
      enrollmentCount: f._count.enrollments,
      maxStudents: f.maxStudents,
      moduleCount: f._count.modules,
      isEnrolled: enrolledIds.includes(f.id),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

// ─────────────────────────────────────────
// Student sessions for schedule
// ─────────────────────────────────────────

export interface StudentSessionEvent {
  id: string
  moduleId: string
  moduleTitle: string
  date: Date
  startTime: string
  endTime: string
  roomName: string | null
  enrollmentCount: number
}

export async function getStudentSessions({
  from,
  to,
}: {
  from: Date
  to: Date
}): Promise<StudentSessionEvent[]> {
  const userId = await getStudentId()

  const sessions = await db.session.findMany({
    where: {
      module: {
        enrollments: { some: { userId, status: 'ACTIVE' } },
      },
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
// Formation types for filter
// ─────────────────────────────────────────

export async function getFormationTypes(): Promise<FormationType[]> {
  return ['PRESENTIAL', 'REMOTE_LIVE', 'REMOTE_ASYNC']
}

// ─────────────────────────────────────────
// Formation detail (for student view — with sequential lock)
// ─────────────────────────────────────────

export interface FormationDetailMaterial {
  id: string
  title: string
  url: string
  type: string
  completed: boolean
}

export interface FormationDetailSession {
  id: string
  date: Date
  startTime: string
  endTime: string
  roomName: string | null
  attendanceStatus: AttendanceStatus | null
}

export interface FormationDetailModule {
  id: string
  title: string
  description: string
  orderIndex: number
  type: ModuleType
  status: ModuleStatus
  videoUrl: string | null
  duration: number
  isLocked: boolean
  isCompleted: boolean
  progress: number
  sessions: FormationDetailSession[]
  materials: FormationDetailMaterial[]
  totalMaterials: number
  completedMaterials: number
}

export interface FormationDetailResult {
  id: string
  title: string
  description: string
  type: FormationType
  status: FormationStatus
  categoryName: string
  maxStudents: number
  enrollmentCount: number
  enrollmentProgress: number
  enrollmentStatus: EnrollmentStatus
  certificate: string | null
  modules: FormationDetailModule[]
  allModulesCompleted: boolean
}

export async function getFormationDetail(
  formationId: string
): Promise<FormationDetailResult | null> {
  const userId = await getStudentId()

  const formationEnrollment = await db.formationEnrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
    select: { id: true, progress: true, status: true, certificate: true },
  })
  if (!formationEnrollment) return null

  const formation = await db.formation.findUnique({
    where: { id: formationId },
    include: {
      category: { select: { name: true } },
      _count: { select: { enrollments: true } },
      modules: {
        orderBy: { orderIndex: 'asc' },
        include: {
          materials: { select: { id: true, title: true, url: true, type: true } },
          sessions: {
            orderBy: { date: 'asc' },
            include: {
              room: { select: { name: true } },
              attendances: {
                where: {
                  moduleEnrollment: {
                    userId,
                    formationEnrollmentId: formationEnrollment.id,
                  },
                },
                select: { status: true },
                take: 1,
              },
            },
          },
          enrollments: {
            where: { userId, formationEnrollmentId: formationEnrollment.id },
            select: { progress: true, completedAt: true },
            take: 1,
          },
        },
      },
    },
  })

  if (!formation) return null

  // Fetch completed material IDs for this student
  const completedMaterials = await db.materialProgress.findMany({
    where: { userId },
    select: { materialId: true },
  })
  const completedMaterialSet = new Set(completedMaterials.map(m => m.materialId))

  // Build completed-module set for sequential lock logic
  const completedModuleIds = new Set(
    formation.modules
      .filter(m => m.enrollments[0]?.completedAt != null)
      .map(m => m.id)
  )

  const allModulesCompleted =
    formation.modules.length > 0 &&
    formation.modules.every(m => completedModuleIds.has(m.id))

  return {
    id: formation.id,
    title: formation.title,
    description: formation.description,
    type: formation.type,
    status: formation.status,
    categoryName: formation.category.name,
    maxStudents: formation.maxStudents,
    enrollmentCount: formation._count.enrollments,
    enrollmentProgress: formationEnrollment.progress,
    enrollmentStatus: formationEnrollment.status,
    certificate: formationEnrollment.certificate,
    allModulesCompleted,
    modules: formation.modules.map((module, idx) => {
      const mats = module.materials.map(m => ({
        id: m.id,
        title: m.title,
        url: m.url,
        type: m.type,
        completed: completedMaterialSet.has(m.id),
      }))

      // Sequential lock: module 0 always accessible, otherwise check previous completed
      let isLocked = false
      if (idx > 0) {
        const prevModule = formation.modules[idx - 1]
        isLocked = !completedModuleIds.has(prevModule.id)
      }

      const isCompleted = completedModuleIds.has(module.id)
      const enrollment = module.enrollments[0]

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        orderIndex: module.orderIndex,
        type: module.type,
        status: module.status,
        videoUrl: module.videoUrl,
        duration: module.duration,
        isLocked,
        isCompleted,
        progress: enrollment?.progress ?? 0,
        sessions: module.sessions.map(s => ({
          id: s.id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          roomName: s.room?.name ?? null,
          attendanceStatus: s.attendances[0]?.status ?? null,
        })),
        materials: mats,
        totalMaterials: mats.length,
        completedMaterials: mats.filter(m => m.completed).length,
      }
    }),
  }
}

// ─────────────────────────────────────────
// Single module detail (student page)
// ─────────────────────────────────────────

export interface StudentModuleDetail {
  id: string
  title: string
  description: string
  orderIndex: number
  type: ModuleType
  status: ModuleStatus
  videoUrl: string | null
  duration: number
  formationId: string
  formationTitle: string
  isLocked: boolean
  isCompleted: boolean
  progress: number
  sessions: FormationDetailSession[]
  materials: FormationDetailMaterial[]
  totalMaterials: number
  completedMaterials: number
}

export async function getStudentModuleDetail(
  formationId: string,
  moduleId: string
): Promise<StudentModuleDetail | null> {
  const userId = await getStudentId()

  // Must be enrolled in the formation
  const formationEnrollment = await db.formationEnrollment.findUnique({
    where: { userId_formationId: { userId, formationId } },
    select: { id: true },
  })
  if (!formationEnrollment) return null

  // Load the target module and the previous one (for lock logic)
  const module = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      formation: { select: { id: true, title: true } },
      materials: { select: { id: true, title: true, url: true, type: true }, orderBy: { id: 'asc' } },
      sessions: {
        orderBy: { date: 'asc' },
        include: {
          room: { select: { name: true } },
          attendances: {
            where: {
              moduleEnrollment: {
                userId,
                formationEnrollmentId: formationEnrollment.id,
              },
            },
            select: { status: true },
            take: 1,
          },
        },
      },
      enrollments: {
        where: { userId, formationEnrollmentId: formationEnrollment.id },
        select: { progress: true, completedAt: true },
        take: 1,
      },
    },
  })

  if (!module || module.formationId !== formationId) return null

  // Sequential lock: check if previous module is completed
  let isLocked = false
  if (module.orderIndex > 0) {
    const prevModule = await db.module.findFirst({
      where: { formationId, orderIndex: module.orderIndex - 1 },
      select: { id: true },
    })
    if (prevModule) {
      const prevEnrollment = await db.moduleEnrollment.findUnique({
        where: { userId_moduleId: { userId, moduleId: prevModule.id } },
        select: { completedAt: true },
      })
      isLocked = !prevEnrollment?.completedAt
    }
  }

  // Fetch completed material IDs for this student
  const completedMaterials = await db.materialProgress.findMany({
    where: { userId, materialId: { in: module.materials.map(m => m.id) } },
    select: { materialId: true },
  })
  const completedMaterialSet = new Set(completedMaterials.map(m => m.materialId))

  const mats: FormationDetailMaterial[] = module.materials.map(m => ({
    id: m.id,
    title: m.title,
    url: m.url,
    type: m.type,
    completed: completedMaterialSet.has(m.id),
  }))

  const enrollment = module.enrollments[0]
  const isCompleted = enrollment?.completedAt != null

  return {
    id: module.id,
    title: module.title,
    description: module.description,
    orderIndex: module.orderIndex,
    type: module.type,
    status: module.status,
    videoUrl: module.videoUrl,
    duration: module.duration,
    formationId: module.formation.id,
    formationTitle: module.formation.title,
    isLocked,
    isCompleted,
    progress: enrollment?.progress ?? 0,
    sessions: module.sessions.map(s => ({
      id: s.id,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      roomName: s.room?.name ?? null,
      attendanceStatus: s.attendances[0]?.status ?? null,
    })),
    materials: mats,
    totalMaterials: mats.length,
    completedMaterials: mats.filter(m => m.completed).length,
  }
}

// ─────────────────────────────────────────
// Mark async material as complete
// ─────────────────────────────────────────

export async function markMaterialComplete(
  materialId: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getStudentId()

  const material = await db.moduleMaterial.findUnique({
    where: { id: materialId },
    include: {
      module: {
        include: {
          formation: {
            include: {
              enrollments: {
                where: { userId, status: 'ACTIVE' },
                select: { id: true },
                take: 1,
              },
            },
          },
          enrollments: {
            where: { userId, status: 'ACTIVE' },
            select: { id: true, moduleId: true },
            take: 1,
          },
          materials: { select: { id: true } },
        },
      },
    },
  })

  if (!material) return { success: false, error: 'Ressource introuvable.' }
  const enrollment = material.module.enrollments[0]
  if (!enrollment) return { success: false, error: 'Non inscrit à ce module.' }

  await db.materialProgress.upsert({
    where: { userId_materialId: { userId, materialId } },
    create: { userId, materialId },
    update: {},
  })

  // Recompute module-level progress
  const totalMaterials = material.module.materials.length
  if (totalMaterials > 0) {
    const completedCount = await db.materialProgress.count({
      where: { userId, materialId: { in: material.module.materials.map(m => m.id) } },
    })
    const moduleProgress = Math.round((completedCount / totalMaterials) * 100)
    await db.moduleEnrollment.update({
      where: { id: enrollment.id },
      data: { progress: moduleProgress },
    })
  }

  revalidatePath(`/student/formations/${material.module.formationId}`)
  return { success: true }
}
