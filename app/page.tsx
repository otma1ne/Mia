import { db } from '@/lib/db'
import LandingPage from '@/components/landing/landing-page'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const raw = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { formations: true } } },
  })

  const categories = raw.map(c => ({
    name:        c.name,
    description: c.description ?? '',
    count:       c._count.formations,
  }))

  return <LandingPage categories={categories} />
}
