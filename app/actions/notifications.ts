'use server'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getNotifications(take = 30) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return []

  return db.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return 0

  return db.notification.count({ where: { read: false } })
}

export async function markNotificationRead(id: string) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return

  await db.notification.update({ where: { id }, data: { read: true } })
  revalidatePath('/admin', 'layout')
}

export async function markAllNotificationsRead() {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return

  await db.notification.updateMany({ where: { read: false }, data: { read: true } })
  revalidatePath('/admin', 'layout')
}
