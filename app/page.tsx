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
      <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-16 gap-10"
            style={{ background: 'var(--mia-near-black)' }}>
        {/* Logo */}
        <Image src={logoLightSrc} alt="MIA Académie" width={64} height={64} className="object-contain" />

        {/* Heading */}
        <div className="text-center max-w-md">
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
                style={{ background: 'rgba(107,43,217,0.18)', color: 'var(--mia-purple-soft)', border: '1px solid rgba(107,43,217,0.3)' }}>
            Bientôt disponible
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            La plateforme de formation<br />
            <span style={{ color: 'var(--mia-purple-soft)' }}>MIA Académie</span>
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Nous préparons quelque chose d&apos;exceptionnel. Rejoins la liste d&apos;attente
            pour être parmi les premiers à accéder à la plateforme.
          </p>
        </div>

        {/* Waitlist form */}
        <WaitlistForm />
      </main>
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
