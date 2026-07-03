'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') redirect('/unauthorized')
}

export async function getSkills() {
  return db.skill.findMany({ orderBy: { name: 'asc' } })
}

export async function createSkill(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Le nom est obligatoire.' }

  const existing = await db.skill.findUnique({ where: { name } })
  if (existing) return { error: 'Cette compétence existe déjà.' }

  await db.skill.create({ data: { name } })
  revalidatePath('/admin/center')
  return { success: true }
}

export async function deleteSkill(id: string): Promise<void> {
  await requireAdmin()
  await db.skill.delete({ where: { id } })
  revalidatePath('/admin/center')
}
