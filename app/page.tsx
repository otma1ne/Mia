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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'MIA Académie',
    url: 'https://mia-academie.com',
    logo: 'https://mia-academie.com/og-image.jpg',
    email: 'contact@mia-academie.com',
    description:
      'Centre de formation professionnelle à Casablanca proposant des formations certifiées en développement web, data science, design et marketing digital.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '45 Avenue de la Formation',
      addressLocality: 'Casablanca',
      postalCode: '20250',
      addressCountry: 'MA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 33.5731,
      longitude: -7.5898,
    },
    areaServed: {
      '@type': 'Country',
      name: 'Maroc',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Formations professionnelles',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Développement Web' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Data Science & IA' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Design UI/UX' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Course', name: 'Marketing Digital' } },
      ],
    },
    sameAs: [
      'https://mia-academie.com',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage categories={categories} formations={formations} />
    </>
  )
}
