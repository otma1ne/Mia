import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import type { UserRole } from '@/lib/db'

// ─────────────────────────────────────────
// Get current session (nullable)
// ─────────────────────────────────────────

export async function getSession() {
  const session = await auth()
  return session
}

// ─────────────────────────────────────────
// Require authenticated session (redirects to /login if not)
// ─────────────────────────────────────────

export async function requireAuth() {
  const session = await auth()
  if (!session) redirect('/login')
  return session
}

// ─────────────────────────────────────────
// Require specific role(s) (redirects to /unauthorized if wrong role)
// ─────────────────────────────────────────

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireAuth()
  const roles = Array.isArray(role) ? role : [role]
  if (!roles.includes(session.user.role)) redirect('/unauthorized')
  return session
}

// ─────────────────────────────────────────
// Role check helpers
// ─────────────────────────────────────────

export async function requireAdmin() {
  return requireRole('ADMIN')
}

export async function requireTrainer() {
  return requireRole(['ADMIN', 'TRAINER'])
}

export async function requireStudent() {
  return requireAuth()
}

export async function requireCommercial() {
  return requireRole('COMMERCIAL')
}

// ─────────────────────────────────────────
// Password utilities
// ─────────────────────────────────────────

import bcrypt from 'bcryptjs'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
