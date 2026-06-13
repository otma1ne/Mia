// Re-export Prisma-generated types for easy importing throughout the app
export type {
  User,
  Trainer,
  TrainerAvailability,
  Center,
  OperatingHours,
  Room,
  Category,
  Formation,
  FormationEnrollment,
  Module,
  ModuleMaterial,
  ModuleEnrollment,
  MaterialProgress,
  Session,
  Attendance,
  Inscription,
  EvaluationToken,
} from '@prisma/client'

export {
  UserRole,
  FormationType,
  FormationStatus,
  ModuleType,
  ModuleStatus,
  EnrollmentStatus,
  AttendanceStatus,
  InscriptionStatus,
} from '@prisma/client'

// ─────────────────────────────────────────
// Extended types (with relations)
// ─────────────────────────────────────────

import type {
  User,
  Trainer,
  Module,
  ModuleEnrollment,
  ModuleMaterial,
  Session,
  Attendance,
  Category,
  Room,
  Inscription,
  Formation,
} from '@prisma/client'

import type { ModuleType, ModuleStatus, AttendanceStatus } from '@prisma/client'

export type TrainerWithUser = Trainer & {
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'phone'>
}

export type ModuleWithDetails = Module & {
  trainer: TrainerWithUser | null
  _count: { moduleEnrollments: number; materials: number; sessions: number }
  formation?: Pick<Formation, 'id' | 'title'>
}

export type ModuleWithMaterials = Module & {
  materials: ModuleMaterial[]
}

export type ModuleEnrollmentWithModule = ModuleEnrollment & {
  module: ModuleWithDetails
}

export type ModuleEnrollmentWithUser = ModuleEnrollment & {
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'phone'>
}

export type SessionWithRoom = Session & {
  room: Room | null
}

export type SessionWithModule = Session & {
  module: Pick<Module, 'id' | 'title'>
  room: Room | null
}

export type AttendanceWithStudent = Attendance & {
  moduleEnrollment: ModuleEnrollmentWithUser
}

export type InscriptionWithFormation = Inscription & {
  formation: Pick<Formation, 'id' | 'title'>
}

// ─────────────────────────────────────────
// Student-facing view types
// ─────────────────────────────────────────

export interface StudentSessionView {
  id: string
  date: Date
  startTime: string
  endTime: string
  roomName: string | null
  attendanceStatus: AttendanceStatus | null
}

export interface StudentMaterialView {
  id: string
  title: string
  url: string
  type: string
  completed: boolean
}

export interface StudentModuleView {
  id: string
  title: string
  description: string
  orderIndex: number
  type: ModuleType
  status: ModuleStatus
  videoUrl: string | null
  duration: number
  trainerName: string | null
  trainerAvatar: string | null
  isLocked: boolean
  isCompleted: boolean
  progress: number
  // For PRACTICAL modules:
  sessions: StudentSessionView[]
  // For THEORY / ASSESSMENT modules:
  materials: StudentMaterialView[]
  totalMaterials: number
  completedMaterials: number
}

// ─────────────────────────────────────────
// Form / Action types
// ─────────────────────────────────────────

export interface ActionResult<T = undefined> {
  success: boolean
  error?: string
  data?: T
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
