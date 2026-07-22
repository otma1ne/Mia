import { db } from '@/lib/db'
import LandingPage from '@/components/landing/landing-page'
import WaitlistForm from '@/components/landing/waitlist-form'
import Image from 'next/image'
import logoLightSrc from '@/public/logo-light.png'
import type { FormationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  if (process.env.COMING_SOON === 'true') {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #0f0c29 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        gap: '2rem',
      }}>
        <Image src={logoLightSrc} alt="MIA Académie" width={72} height={72} style={{ objectFit: 'contain' }} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Bientôt disponible
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1rem', maxWidth: '380px' }}>
            MIA Académie ouvre bientôt ses portes. Rejoins la liste d&apos;attente pour être prévenu(e) en premier.
          </p>
        </div>
        <WaitlistForm />
      </div>
    )
  }

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
      'Centre de formation professionnelle à Paris proposant des formations certifiées en développement web, data science, design et marketing digital.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '45 Avenue de la Formation',
      addressLocality: 'Paris',
      postalCode: '75000',
      addressCountry: 'FR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 48.8566,
      longitude: 2.3522,
    },
    areaServed: {
      '@type': 'Country',
      name: 'France',
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
