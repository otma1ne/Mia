/**
 * Cleanup script — removes test data:
 *   - All Inscriptions
 *   - All Users with role STUDENT
 *   - Specific non-MIA formations
 *
 * Usage: npx tsx scripts/cleanup-test-data.ts
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local') })
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Keywords that identify MIA formations to KEEP (all others will be deleted)
const MIA_KEYWORDS = [
  'ChatGPT',
  'Excel & IA',
  'IA & Automatisation',
  'Microsoft 365 Copilot',
  'Power BI',
]

function isMiaFormation(title: string): boolean {
  return MIA_KEYWORDS.some(kw => title.includes(kw))
}

async function main() {
  console.log('🧹 Cleanup des données de test\n')

  // 1. Delete all inscriptions
  const deletedInscriptions = await db.inscription.deleteMany({})
  console.log(`✅ ${deletedInscriptions.count} inscription(s) supprimée(s)`)

  // 2. Delete all student users (cascades enrollments, module progress, etc.)
  const deletedStudents = await db.user.deleteMany({ where: { role: 'STUDENT' } })
  console.log(`✅ ${deletedStudents.count} étudiant(s) supprimé(s)`)

  // 3. Delete non-MIA formations
  const allFormations = await db.formation.findMany({ select: { id: true, title: true } })
  const toDelete = allFormations.filter(f => !isMiaFormation(f.title))

  if (toDelete.length === 0) {
    console.log('ℹ️  Aucune formation non-MIA trouvée')
  } else {
    for (const f of toDelete) {
      await db.formation.delete({ where: { id: f.id } })
      console.log(`🗑️  Formation supprimée : "${f.title}"`)
    }
  }

  console.log(`\n🎉 Terminé !`)
  console.log(`   - ${deletedInscriptions.count} inscription(s) supprimée(s)`)
  console.log(`   - ${deletedStudents.count} étudiant(s) supprimé(s)`)
  console.log(`   - ${toDelete.length} formation(s) supprimée(s)`)
  console.log(`\nFormations MIA conservées :`)
  allFormations.filter(f => isMiaFormation(f.title)).forEach(f => console.log(`   ✔  ${f.title}`))
}

main()
  .catch(e => { console.error('❌ Erreur :', e); process.exit(1) })
  .finally(() => db.$disconnect())
