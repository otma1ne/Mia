/**
 * One-time migration: NOUVEAU→PROSPECT, CONTACTE→INDECIS, RELANCE→INDECIS, CONVERTI→GAGNE
 * Updates both `status` field and every entry in `statusHistory`.
 * Safe to re-run (already-migrated docs are skipped by the where clause).
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const MAP: Record<string, string> = {
  NOUVEAU:  'PROSPECT',
  CONTACTE: 'INDECIS',
  RELANCE:  'INDECIS',
  CONVERTI: 'GAGNE',
}

async function main() {
  console.log('Starting ContactStatus migration...')

  // Migrate contacts whose top-level status is still old
  for (const [oldVal, newVal] of Object.entries(MAP)) {
    const contacts = await db.contact.findMany({
      where: { status: oldVal as any },
    })

    for (const contact of contacts) {
      const migratedHistory = contact.statusHistory.map((h: any) => ({
        ...h,
        status: MAP[h.status] ?? h.status,
      }))

      await db.contact.update({
        where: { id: contact.id },
        data: {
          status: newVal as any,
          statusHistory: migratedHistory,
        },
      })
    }

    if (contacts.length > 0) {
      console.log(`  ${oldVal} → ${newVal}: migrated ${contacts.length} contacts`)
    }
  }

  // Also migrate statusHistory entries on contacts already on new statuses
  const allContacts = await db.contact.findMany()
  let historyFixed = 0
  for (const contact of allContacts) {
    const migratedHistory = (contact.statusHistory as any[]).map((h: any) => ({
      ...h,
      status: MAP[h.status] ?? h.status,
    }))
    const changed = migratedHistory.some(
      (h: any, i: number) => h.status !== (contact.statusHistory as any[])[i].status
    )
    if (changed) {
      await db.contact.update({
        where: { id: contact.id },
        data: { statusHistory: migratedHistory },
      })
      historyFixed++
    }
  }
  if (historyFixed > 0) console.log(`  Fixed statusHistory on ${historyFixed} contacts`)

  console.log('Migration complete.')
}

main()
  .catch(e => { console.error('Migration failed:', e); process.exit(1) })
  .finally(() => db.$disconnect())
