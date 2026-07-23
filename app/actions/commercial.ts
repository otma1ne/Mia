'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import type { ContactStatus } from '@prisma/client'
import type { ZodError } from 'zod'
import { hashPassword } from '@/lib/auth'
import { generatePassword } from '@/lib/generate-password'
import { sendCommercialWelcomeEmail } from '@/lib/email'
import {
  createContactSchema,
  updateContactSchema,
  updateContactStatusSchema,
  createCommercialAccountSchema,
  formatValidationError,
} from '@/lib/validations'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface ContactStatusChangeData {
  status: ContactStatus
  changedAt: Date
  note: string | null
}

export interface ContactRow {
  id: string
  commercialId: string
  firstName: string
  lastName: string
  phone: string
  email: string | null
  city: string | null
  need: string
  status: ContactStatus
  notes: string | null
  reminderDate: Date | null
  reminderSentAt: Date | null
  statusHistory: ContactStatusChangeData[]
  createdAt: Date
  updatedAt: Date
}

export interface ContactsResult {
  contacts: ContactRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CommercialRow {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  contactCount: number
  createdAt: Date
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

async function getCommercialForSession() {
  const session = await auth()
  if (!session) return null
  return db.commercial.findUnique({ where: { userId: session.user.id } })
}

// ─────────────────────────────────────────
// Commercial-scoped actions
// ─────────────────────────────────────────

export async function getMyContacts({
  page = 1,
  pageSize = 10,
  search = '',
  status,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: ContactStatus
} = {}): Promise<ContactsResult> {
  const commercial = await getCommercialForSession()
  if (!commercial) return { contacts: [], total: 0, page, pageSize, totalPages: 1 }

  const where = {
    commercialId: commercial.id,
    ...(status ? { status } : {}),
    ...(search.trim()
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName:  { contains: search, mode: 'insensitive' as const } },
            { phone:     { contains: search, mode: 'insensitive' as const } },
            { city:      { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, contacts] = await Promise.all([
    db.contact.count({ where }),
    db.contact.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    contacts: contacts.map(c => ({
      ...c,
      email:         c.email ?? null,
      city:          c.city ?? null,
      notes:         c.notes ?? null,
      reminderDate:  c.reminderDate ?? null,
      reminderSentAt: c.reminderSentAt ?? null,
      statusHistory: c.statusHistory.map(h => ({
        status:    h.status,
        changedAt: h.changedAt,
        note:      h.note ?? null,
      })),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function createContact(data: {
  firstName: string
  lastName: string
  phone: string
  email?: string
  city?: string
  need: string
}) {
  const commercial = await getCommercialForSession()
  if (!commercial) return { error: 'Non autorisé' }

  try {
    const validated = createContactSchema.parse(data)
    await db.contact.create({
      data: {
        ...validated,
        commercialId: commercial.id,
        statusHistory: [{ status: 'PROSPECT', changedAt: new Date(), note: null }],
      },
    })
    revalidatePath('/commercial/contacts')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return { error: formatValidationError(err as unknown as ZodError) }
    console.error('[createContact]', err)
    return { error: 'Erreur lors de la création du contact' }
  }
}

export async function updateContact(
  id: string,
  data: {
    firstName?: string
    lastName?: string
    phone?: string
    email?: string
    city?: string
    need?: string
  }
) {
  const commercial = await getCommercialForSession()
  if (!commercial) return { error: 'Non autorisé' }

  const contact = await db.contact.findUnique({ where: { id } })
  if (!contact || contact.commercialId !== commercial.id) return { error: 'Contact introuvable' }

  try {
    const validated = updateContactSchema.parse(data)
    await db.contact.update({ where: { id }, data: validated })
    revalidatePath('/commercial/contacts')
    revalidatePath(`/commercial/contacts/${id}`)
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return { error: formatValidationError(err as unknown as ZodError) }
    console.error('[updateContact]', err)
    return { error: 'Erreur lors de la mise à jour du contact' }
  }
}

export async function updateContactStatus(
  id: string,
  status: ContactStatus,
  note?: string,
  reminderDate?: Date | null
) {
  const commercial = await getCommercialForSession()
  if (!commercial) return { error: 'Non autorisé' }

  const contact = await db.contact.findUnique({ where: { id } })
  if (!contact || contact.commercialId !== commercial.id) return { error: 'Contact introuvable' }

  try {
    updateContactStatusSchema.parse({ status, note })

    if (status === 'INDECIS' && reminderDate != null) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (reminderDate < today) {
        return { error: 'La date de rappel doit être aujourd\'hui ou dans le futur.' }
      }
    }

    // Clear reminder fields unless transitioning to INDECIS
    const reminderUpdate =
      status === 'INDECIS'
        ? { reminderDate: reminderDate ?? null, reminderSentAt: null }
        : { reminderDate: null, reminderSentAt: null }

    await db.contact.update({
      where: { id },
      data: {
        status,
        ...reminderUpdate,
        statusHistory: {
          push: { status, changedAt: new Date(), note: note ?? null },
        },
      },
    })
    revalidatePath('/commercial/contacts')
    revalidatePath(`/commercial/contacts/${id}`)
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return { error: formatValidationError(err as unknown as ZodError) }
    console.error('[updateContactStatus]', err)
    return { error: 'Erreur lors du changement de statut' }
  }
}

export async function convertContactToGagne(
  contactId: string,
  formationId: string,
  note?: string,
  trainingSessionId?: string,
): Promise<{ success: boolean; error?: string }> {
  const commercial = await getCommercialForSession()
  if (!commercial) return { success: false, error: 'Non autorisé' }

  const contact = await db.contact.findUnique({ where: { id: contactId } })
  if (!contact || contact.commercialId !== commercial.id) {
    return { success: false, error: 'Contact introuvable' }
  }

  if (!contact.email) {
    return { success: false, error: 'Ce contact n\'a pas d\'email — impossible de créer une inscription.' }
  }

  const formation = await db.formation.findUnique({
    where: { id: formationId, status: 'PUBLISHED' },
    select: { id: true, title: true },
  })
  if (!formation) return { success: false, error: 'Formation introuvable ou non publiée.' }

  // Create inscription + update contact atomically (duplicate check inside tx for race safety)
  let alreadyExists = false
  await db.$transaction(async (tx) => {
    const existing = await tx.inscription.findFirst({
      where: {
        email: contact.email!,
        formationId,
        status: { in: ['PENDING', 'EVALUATED', 'PENDING_SIGNATURE'] },
      },
    })
    if (existing) { alreadyExists = true; return }

    await tx.inscription.create({
      data: {
        firstName:  contact.firstName,
        lastName:   contact.lastName,
        email:      contact.email!,
        phone:      contact.phone,
        formationId,
        ...(trainingSessionId ? { trainingSessionId } : {}),
        status:     'PENDING',
        source:     'COMMERCIAL',
        contactId,
      },
    })
    await tx.contact.update({
      where: { id: contactId },
      data: {
        status:        'GAGNE',
        reminderDate:  null,
        reminderSentAt: null,
        statusHistory: {
          push: {
            status:    'GAGNE',
            changedAt: new Date(),
            note:      note ?? `Inscrit à la formation : ${formation.title!}`,
          },
        },
      },
    })
  })

  if (alreadyExists) {
    return { success: false, error: 'Une demande est déjà en cours pour cet email et cette formation.' }
  }

  revalidatePath('/commercial/contacts')
  revalidatePath(`/commercial/contacts/${contactId}`)
  revalidatePath('/admin/inscriptions')
  return { success: true }
}

export async function getPublishedFormationsBasic(): Promise<{
  id: string
  title: string
  sessions: { id: string; title: string; formationId: string }[]
}[]> {
  const formations = await db.formation.findMany({
    where:   { status: 'PUBLISHED' },
    select:  { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  const sessions = await db.trainingSession.findMany({
    where:  { status: { in: ['OPEN', 'STARTED'] } },
    select: { id: true, title: true, formationId: true },
    orderBy: { startDate: 'asc' },
  })

  return formations.map(f => ({
    id:       f.id,
    title:    f.title,
    sessions: sessions.filter(s => s.formationId === f.id),
  }))
}

export async function updateContactNotes(id: string, notes: string) {
  const commercial = await getCommercialForSession()
  if (!commercial) return { error: 'Non autorisé' }

  const contact = await db.contact.findUnique({ where: { id } })
  if (!contact || contact.commercialId !== commercial.id) return { error: 'Contact introuvable' }

  try {
    await db.contact.update({ where: { id }, data: { notes: notes.trim() || null } })
    revalidatePath(`/commercial/contacts/${id}`)
    return { success: true }
  } catch (err) {
    console.error('[updateContactNotes]', err)
    return { error: 'Erreur lors de la mise à jour des notes' }
  }
}

export async function deleteContact(id: string) {
  const commercial = await getCommercialForSession()
  if (!commercial) return { error: 'Non autorisé' }

  const contact = await db.contact.findUnique({ where: { id } })
  if (!contact || contact.commercialId !== commercial.id) return { error: 'Contact introuvable' }

  try {
    await db.contact.delete({ where: { id } })
    revalidatePath('/commercial/contacts')
    return { success: true }
  } catch (err) {
    console.error('[deleteContact]', err)
    return { error: 'Erreur lors de la suppression du contact' }
  }
}

export async function getCommercialStats(commercialId?: string): Promise<Record<ContactStatus, number>> {
  const empty: Record<ContactStatus, number> = { PROSPECT: 0, INDECIS: 0, GAGNE: 0, PERDU: 0 }
  const session = await auth()
  if (!session) return empty

  let resolvedId = commercialId

  if (session.user.role === 'COMMERCIAL') {
    const commercial = await db.commercial.findUnique({ where: { userId: session.user.id } })
    if (!commercial) return empty
    resolvedId = commercial.id
  } else if (session.user.role !== 'ADMIN') {
    return empty
  }

  const where = resolvedId ? { commercialId: resolvedId } : {}
  const counts = await db.contact.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
  })

  const result: Record<ContactStatus, number> = { PROSPECT: 0, INDECIS: 0, GAGNE: 0, PERDU: 0 }
  for (const row of counts) {
    result[row.status] = row._count._all
  }
  return result
}

// ─────────────────────────────────────────
// Admin-only actions
// ─────────────────────────────────────────

export async function getAllContacts({
  page = 1,
  pageSize = 10,
  search = '',
  status,
  repId,
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: ContactStatus
  repId?: string
} = {}): Promise<{
  contacts: (ContactRow & { commercialName: string })[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') {
    return { contacts: [], total: 0, page, pageSize, totalPages: 1 }
  }

  const where = {
    ...(repId ? { commercialId: repId } : {}),
    ...(status ? { status } : {}),
    ...(search.trim()
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName:  { contains: search, mode: 'insensitive' as const } },
            { phone:     { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, contacts] = await Promise.all([
    db.contact.count({ where }),
    db.contact.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: { commercial: { include: { user: { select: { name: true } } } } },
    }),
  ])

  return {
    contacts: contacts.map(c => ({
      id:             c.id,
      commercialId:   c.commercialId,
      firstName:      c.firstName,
      lastName:       c.lastName,
      phone:          c.phone,
      email:          c.email ?? null,
      city:           c.city ?? null,
      need:           c.need,
      status:         c.status,
      notes:          c.notes ?? null,
      reminderDate:   c.reminderDate ?? null,
      reminderSentAt: c.reminderSentAt ?? null,
      statusHistory:  c.statusHistory.map(h => ({
        status:    h.status,
        changedAt: h.changedAt,
        note:      h.note ?? null,
      })),
      createdAt:      c.createdAt,
      updatedAt:      c.updatedAt,
      commercialName: c.commercial.user.name,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export async function getCommercials(): Promise<CommercialRow[]> {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return []

  const commercials = await db.commercial.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      _count: { select: { contacts: true } },
    },
  })
  return commercials.map(c => ({
    id:           c.id,
    userId:       c.userId,
    name:         c.user.name,
    email:        c.user.email,
    phone:        c.user.phone ?? null,
    contactCount: c._count.contacts,
    createdAt:    c.createdAt,
  }))
}

export async function createCommercialAccount(data: {
  name: string
  email: string
  phone?: string
}) {
  const session = await auth()
  if (!session || session.user.role !== 'ADMIN') return { error: 'Non autorisé' }

  try {
    const validated = createCommercialAccountSchema.parse(data)

    const existing = await db.user.findUnique({ where: { email: validated.email } })
    if (existing) return { error: 'Un compte avec cet email existe déjà.' }

    const tempPassword = generatePassword()
    const hashed = await hashPassword(tempPassword)

    await db.user.create({
      data: {
        name:     validated.name,
        email:    validated.email,
        phone:    validated.phone ?? null,
        password: hashed,
        role:     'COMMERCIAL',
        commercial: { create: {} },
      },
    })

    await sendCommercialWelcomeEmail(validated.email, validated.name, tempPassword)

    revalidatePath('/admin/commercial')
    return { success: true }
  } catch (err) {
    if (err instanceof Error && 'issues' in err) return { error: formatValidationError(err as unknown as ZodError) }
    console.error('[createCommercialAccount]', err)
    return { error: 'Erreur lors de la création du compte commercial' }
  }
}
