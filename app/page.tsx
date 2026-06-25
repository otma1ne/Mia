import { db } from '@/lib/db'
import LandingPage from '@/components/landing/landing-page'
import type { FormationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [rawCategories, rawFormations] = await Promise.all([
    db.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { formations: true } } },
    }),
    db.formation.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        category: { select: { name: true } },
        _count: { select: { enrollments: true, modules: true } },
      },
    }),
  ])

  const categories = rawCategories.map(c => ({
    name:        c.name,
    description: c.description ?? '',
    count:       c._count.formations,
  }))

  const formations = rawFormations.map(f => ({
    id:              f.id,
    title:           f.title,
    description:     f.description,
    categoryName:    f.category.name,
    type:            f.type as FormationType,
    price:           f.price,
    duration:        f.duration,
    thumbnail:       f.thumbnail,
    enrollmentCount: f._count.enrollments,
    moduleCount:     f._count.modules,
  }))

  return <LandingPage categories={categories} formations={formations} />
}
