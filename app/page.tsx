import { db } from '@/lib/db'
import LandingPage from '@/components/landing/landing-page'
import WaitlistForm from '@/components/landing/waitlist-form'
import type { FormationType } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function HomePage() {

  // MODE COMING SOON
  if (process.env.COMING_SOON === 'true') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-16 gap-10"
        style={{ background: 'var(--mia-near-black)' }}>

        <div className="text-center max-w-md">
          <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: 'rgba(107,43,217,0.18)',
              color: 'var(--mia-purple-soft)',
              border: '1px solid rgba(107,43,217,0.3)'
            }}>
            Bientôt disponible
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            La plateforme de formation<br />
            <span style={{ color: 'var(--mia-purple-soft)' }}>
              MIA Académie
            </span>
          </h1>

          <p className="text-base leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            Nous préparons quelque chose d'exceptionnel.
            Rejoins la liste d'attente pour être parmi les premiers.
          </p>
        </div>

        <WaitlistForm />
      </main>
    )
  }

  // 🔥 DONNÉES (VERSION SAFE)
  const [rawCategories, rawFormations] = await Promise.all([
    db.category.findMany({
      orderBy: { name: 'asc' },
    }),

    db.formation.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ])

  // 🔥 FORMATAGE SAFE
  const categories = rawCategories.map(c => ({
    name: c.name,
    description: c.description ?? '',
    count: 0, // temporaire
  }))

  const formations = rawFormations.map(f => ({
    id: f.id,
    title: f.title,
    description: f.description,
    categoryName: '', // temporaire
    type: f.type as FormationType,
    price: f.price,
    duration: f.duration,
    thumbnail: f.thumbnail,
    enrollmentCount: 0,
    moduleCount: 0,
  }))

  // SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'MIA Académie',
    url: 'https://mia-academie.com',
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* TA PAGE */}
      <LandingPage
        categories={categories}
        formations={formations}
      />
    </>
  )
}