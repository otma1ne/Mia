'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getCurrentUser() {
  const session = await auth()
  if (!session) redirect('/login')
  return session.user
}

// ─────────────────────────────────────────
// Update profile info (name, phone)
// ─────────────────────────────────────────

export async function updateProfile(_prevState: unknown, formData: FormData) {
  const sessionUser = await getCurrentUser()
  const name  = (formData.get('name')  as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim() || null

  if (!name) return { error: 'Name is required.' }

  await db.user.update({
    where: { id: sessionUser.id },
    data: { name, phone },
  })

  revalidatePath('/admin/settings')
  revalidatePath('/trainer/settings')
  revalidatePath('/student/settings')
  return { success: true, message: 'Profile updated.' }
}

// ─────────────────────────────────────────
// Change password
// ─────────────────────────────────────────

export async function changePassword(_prevState: unknown, formData: FormData) {
  const sessionUser = await getCurrentUser()
  const current     = (formData.get('current')  as string)
  const next        = (formData.get('next')      as string)
  const confirm     = (formData.get('confirm')   as string)

  if (!current || !next || !confirm) return { error: 'All fields are required.' }
  if (next.length < 8)               return { error: 'New password must be at least 8 characters.' }
  if (next !== confirm)              return { error: 'Passwords do not match.' }

  const user = await db.user.findUnique({ where: { id: sessionUser.id } })
  if (!user) return { error: 'User not found.' }

  const valid = await verifyPassword(current, user.password)
  if (!valid) return { error: 'Current password is incorrect.' }

  const hashed = await hashPassword(next)
  await db.user.update({ where: { id: user.id }, data: { password: hashed } })

  return { success: true, message: 'Password changed.' }
}

// ─────────────────────────────────────────
// Get full user profile
// ─────────────────────────────────────────

export async function getProfile() {
  const sessionUser = await getCurrentUser()
  return db.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, createdAt: true },
  })
}
