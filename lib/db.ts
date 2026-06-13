import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma Client instances in development (Next.js hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Re-export Prisma types for convenience
export type { Prisma } from '@prisma/client'
export {
  UserRole,
  ModuleStatus,
  ModuleType,
  EnrollmentStatus,
  AttendanceStatus,
} from '@prisma/client'
