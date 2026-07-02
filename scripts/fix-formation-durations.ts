import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env.local') })
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') })

import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const result = await db.formation.updateMany({
    data: { duration: 420 }, // 7H
  })
  console.log(`✅ ${result.count} formation(s) mises à jour → 7H (420 min)`)
}

main()
  .catch(e => { console.error('❌', e); process.exit(1) })
  .finally(() => db.$disconnect())
