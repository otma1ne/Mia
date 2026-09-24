'use server'

import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { notifyNewLead } from '@/lib/lead-notifications'

export interface LeadInput {
  name: string
  email: string
  phone: string
  company: string
  formationId: string // '' ou 'autre' = pas de formation précise
  message: string
  website?: string    // honeypot anti-spam (doit rester vide)
}

/** Formations proposées dans le select (publiées uniquement). */
export async function getLeadFormations() {
  return db.formation.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true, category: { select: { name: true } } },
    orderBy: { title: 'asc' },
  })
}

export async function submitLead(input: LeadInput) {
  // Anti-spam : un robot remplit le champ caché
  if (input.website) {
    console.warn('[leads] Demande ignorée : champ anti-spam rempli (robot ou remplissage automatique)')
    return { success: true }
  }

  const ip = getClientIp(await headers())
  const rl = checkRateLimit(`lead:${ip}`, { interval: 1000 * 60 * 15, maxRequests: 5 })
  if (!rl.allowed) {
    return { success: false, error: 'Trop de demandes. Réessayez dans quelques minutes.' }
  }

  const name    = input.name.trim()
  const email   = input.email.trim().toLowerCase()
  const phone   = input.phone.trim()
  const company = input.company.trim()
  const message = input.message.trim()

  if (!name || !email || !phone || !input.formationId) {
    return { success: false, error: 'Veuillez remplir tous les champs obligatoires.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Adresse email invalide.' }
  }
  if (!/^[+\d][\d\s().-]{7,}$/.test(phone)) {
    return { success: false, error: 'Numéro de téléphone invalide.' }
  }
  if (message.length > 2000) {
    return { success: false, error: 'Message trop long (2000 caractères max).' }
  }

  let formationId: string | null = null
  let formationTitle = 'Autre / je ne sais pas encore'
  if (input.formationId !== 'autre') {
    const formation = /^[a-f\d]{24}$/i.test(input.formationId)
      ? await db.formation.findFirst({
          where: { id: input.formationId, status: 'PUBLISHED' },
          select: { id: true, title: true },
        })
      : null
    if (!formation) return { success: false, error: 'Formation invalide.' }
    formationId = formation.id
    formationTitle = formation.title
  }

  const lead = await db.lead.create({
    data: {
      name, email, phone,
      company: company || null,
      formationId, formationTitle,
      message: message || null,
    },
  })

  console.log(`[leads] Nouveau lead enregistré : ${lead.id} (${name} — ${formationTitle})`)

  // Notifications Slack / Telegram / WhatsApp (non bloquant en cas d'échec)
  try {
    await notifyNewLead({ name, email, phone, company, formation: formationTitle, message })
  } catch (err) {
    console.error('[leads] notification error:', err)
  }

  return { success: true }
}
