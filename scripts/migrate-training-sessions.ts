/**
 * Migration: introduce TrainingSession between Formation and FormationEnrollment.
 *
 * For each Formation that has existing enrollments or inscriptions, we create
 * one default TrainingSession ("Promotion initiale") and link all existing
 * FormationEnrollment + Inscription records to it.
 *
 * Formations with no enrollments get a TrainingSession only if they are PUBLISHED.
 *
 * Run with:
 *   $env:DATABASE_URL="..."; npx tsx scripts/migrate-training-sessions.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const formations = await db.formation.findMany({
    include: {
      enrollments:  { select: { id: true } },
      inscriptions: { select: { id: true } },
      trainingSessions: { select: { id: true } },
    },
  })

  console.log(`Found ${formations.length} formations.`)

  for (const f of formations) {
    // Skip if already has at least one TrainingSession
    if (f.trainingSessions.length > 0) {
      console.log(`  ⏭  ${f.title} — already has ${f.trainingSessions.length} session(s), skipping.`)
      continue
    }

    // Only create for formations that have enrollments, inscriptions, or are published
    const hasActivity = f.enrollments.length > 0 || f.inscriptions.length > 0
    if (!hasActivity && f.status !== 'PUBLISHED') {
      console.log(`  ⏭  ${f.title} — no activity and not published, skipping.`)
      continue
    }

    // Create a default TrainingSession
    const ts = await db.trainingSession.create({
      data: {
        formationId: f.id,
        title:       'Promotion initiale',
        startDate:   new Date('2025-01-01'),
        endDate:     new Date('2025-12-31'),
        maxStudents: f.maxStudents,
        price:       f.price,
        status:      f.status === 'PUBLISHED' ? 'OPEN' : 'DRAFT',
      },
    })
    console.log(`  ✓  ${f.title} — created TrainingSession "${ts.title}" (${ts.id})`)

    // Link existing FormationEnrollments
    if (f.enrollments.length > 0) {
      await db.formationEnrollment.updateMany({
        where: { formationId: f.id, trainingSessionId: null },
        data:  { trainingSessionId: ts.id },
      })
      console.log(`     → linked ${f.enrollments.length} enrollment(s)`)
    }

    // Link existing Inscriptions
    if (f.inscriptions.length > 0) {
      await db.inscription.updateMany({
        where: { formationId: f.id, trainingSessionId: null },
        data:  { trainingSessionId: ts.id },
      })
      console.log(`     → linked ${f.inscriptions.length} inscription(s)`)
    }
  }

  console.log('\nMigration complete.')
}

main().catch(console.error).finally(() => db.$disconnect())
