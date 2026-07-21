'use server'

import { db } from '@/lib/db'

export async function joinWaitlist(data: {
  firstName: string
  email: string
  phone?: string
}): Promise<{ success: boolean; error?: string }> {
  const firstName = data.firstName?.trim()
  const email     = data.email?.trim().toLowerCase()
  const phone     = data.phone?.trim() || undefined

  if (!firstName || !email) {
    return { success: false, error: 'Prénom et email sont requis.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Adresse email invalide.' }
  }

  try {
    await db.waitlist.upsert({
      where:  { email },
      update: { firstName, phone: phone ?? null },
      create: { firstName, email, phone },
    })
    return { success: true }
  } catch (err) {
    console.error('[joinWaitlist]', err)
    return { success: false, error: 'Une erreur est survenue, réessaie ou écris à contact@miadigital.ma.' }
  }
}
