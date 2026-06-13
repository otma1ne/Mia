/**
 * Script de migration : supprime les collections liées à l'ancien modèle Course
 * avant de lancer prisma db push avec le nouveau schéma Module.
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local first
config({ path: resolve(process.cwd(), '.env.local') })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$connect()

  const collections = [
    'Attendance',
    'Session',
    'Enrollment',
    'MaterialProgress',
    'CourseMaterial',
    'Course',
  ]

  for (const col of collections) {
    try {
      await (prisma as any).$runCommandRaw({ drop: col })
      console.log(`✓ Dropped collection: ${col}`)
    } catch (e: any) {
      if (e?.code === 26 || e?.message?.includes('ns not found')) {
        console.log(`  (skipped — ${col} does not exist)`)
      } else {
        console.error(`✗ Error dropping ${col}:`, e?.message)
      }
    }
  }

  await prisma.$disconnect()
  console.log('\nDone. Run: npx prisma db push')
}

main().catch(console.error)
