import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const BASE = 'https://mia-academie.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques publiques
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/formations`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE}/courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Pages dynamiques : formations publiées
  const formations = await db.formation.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const formationPages: MetadataRoute.Sitemap = formations.map(f => ({
    url: `${BASE}/formations/${f.id}`,
    lastModified: f.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  return [...staticPages, ...formationPages]
}
