import './formation.css'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { db } from '@/lib/db'
import { ArrowRight, Clock, Users, Layers } from 'lucide-react'
import SiteFooter from '@/components/layout/site-footer'
import SiteNav from '@/components/layout/site-nav'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  PRESENTIAL:   'Présentiel',
  REMOTE_LIVE:  'En ligne · Live',
  REMOTE_ASYNC: 'En ligne · Async',
}

const MODULE_TYPE_LABELS: Record<string, string> = {
  THEORY:     'Théorie',
  PRACTICAL:  'Pratique',
  ASSESSMENT: 'Évaluation',
}

const MODULE_TYPE_CLASS: Record<string, string> = {
  THEORY:     'fd-module-type-theory',
  PRACTICAL:  'fd-module-type-practical',
  ASSESSMENT: 'fd-module-type-assessment',
}

// ─── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const f = await db.formation.findUnique({
    where: { id, status: 'PUBLISHED' },
    select: { title: true, description: true },
  })
  if (!f) return { title: 'Formation introuvable' }
  return {
    title: `${f.title} — MIA Formation`,
    description: f.description.slice(0, 160),
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function PublicFormationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const formation = await db.formation.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      category: { select: { name: true } },
      modules: {
        where: { status: 'PUBLISHED' },
        orderBy: { orderIndex: 'asc' },
        select: { id: true, title: true, description: true, type: true, duration: true },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!formation) notFound()

  const totalMinutes = formation.modules.reduce((acc, m) => acc + m.duration, 0)
  const displayDuration = formation.duration ?? (totalMinutes > 0 ? Math.round(totalMinutes / 60) : null)

  const infoRows = [
    { label: 'Mode',      value: TYPE_LABELS[formation.type] ?? formation.type },
    ...(displayDuration ? [{ label: 'Durée', value: `${displayDuration} heures` }] : []),
    { label: 'Catégorie', value: formation.category.name },
    { label: 'Modules',   value: `${formation.modules.length} module${formation.modules.length !== 1 ? 's' : ''}` },
    { label: 'Étudiants', value: `${formation._count.enrollments} inscrit${formation._count.enrollments !== 1 ? 's' : ''}` },
  ]

  return (
    <div className="fd-page">

      <SiteNav />

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="fd-hero-wrap">
        <div className="fd-hero">
          {formation.thumbnail ? (
            <Image
              src={formation.thumbnail}
              alt={formation.title}
              fill
              className="object-cover fd-hero-thumb"
              priority
            />
          ) : (
            <div className="fd-hero-glow" />
          )}
          <div className="fd-hero-fade" />

          <div className="fd-hero-content">
            <div className="fd-hero-badges">
              <span className="fd-badge-cat">{formation.category.name}</span>
              <span className="fd-badge-type">{TYPE_LABELS[formation.type]}</span>
            </div>

            <h1 className="fd-hero-title font-heading">{formation.title}</h1>

            <div className="fd-hero-stats">
              {displayDuration && (
                <span className="fd-hero-stat">
                  <Clock size={15} />
                  {displayDuration}h de formation
                </span>
              )}
              <span className="fd-hero-stat">
                <Layers size={15} />
                {formation.modules.length} module{formation.modules.length !== 1 ? 's' : ''}
              </span>
              <span className="fd-hero-stat">
                <Users size={15} />
                {formation._count.enrollments} inscrit{formation._count.enrollments !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="fd-body">
        <div className="fd-grid">

          {/* Left: description + programme */}
          <div>
            <h2 className="fd-section-title font-heading">À propos de cette formation</h2>
            <p className="fd-desc">{formation.description}</p>

            {formation.modules.length > 0 && (
              <>
                <h2 className="fd-section-title font-heading">
                  Programme de la formation
                  <span className="fd-section-title-count">
                    {formation.modules.length} module{formation.modules.length !== 1 ? 's' : ''}
                  </span>
                </h2>

                <div className="fd-modules">
                  {formation.modules.map((mod, idx) => (
                    <div key={mod.id} className="fd-module">
                      <div className="fd-module-idx">
                        <span className="fd-module-idx-n">{String(idx + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="fd-module-body">
                        <div className={`fd-module-row${mod.description ? '' : ' mb-0'}`}>
                          <span className="fd-module-title">{mod.title}</span>
                          <span className={`fd-module-type ${MODULE_TYPE_CLASS[mod.type] ?? 'fd-module-type-theory'}`}>
                            {MODULE_TYPE_LABELS[mod.type] ?? mod.type}
                          </span>
                          {mod.duration > 0 && (
                            <span className="fd-module-duration">
                              <Clock size={11} /> {mod.duration} min
                            </span>
                          )}
                        </div>
                        {mod.description && (
                          <p className="fd-module-desc">{mod.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right: sticky info card */}
          <div className="fd-sidebar">
            <div className="fd-card">
              <div className="fd-card-price">
                {formation.price != null ? (
                  <>
                    <p className="fd-price-label">Tarif de la formation</p>
                    <div className="fd-price-amount">
                      <span className="fd-price-n">{formation.price.toLocaleString('fr-FR')}</span>
                      <span className="fd-price-unit">€</span>
                    </div>
                    <p className="fd-price-note">Financement CPF / OPCO disponible</p>
                  </>
                ) : (
                  <>
                    <p className="fd-price-on-demand">Tarif sur demande</p>
                    <p className="fd-price-on-demand-sub">Contactez-nous pour un devis personnalisé</p>
                  </>
                )}
              </div>

              <div className="fd-card-rows">
                {infoRows.map(({ label, value }) => (
                  <div key={label} className="fd-card-row">
                    <span className="fd-card-row-label">{label}</span>
                    <span className="fd-card-row-value">{value}</span>
                  </div>
                ))}
              </div>

              <div className="fd-card-ctas">
                <Link href="/register" className="fd-btn-primary">
                  S&apos;inscrire à cette formation
                  <ArrowRight size={16} />
                </Link>
                <Link href="/#contact" className="fd-btn-secondary">
                  Demander un renseignement
                </Link>
              </div>
            </div>

            <div className="fd-trust">
              {['Formation certifiée Qualiopi', 'Éligible CPF & OPCO', 'Formateurs experts du terrain'].map(item => (
                <div key={item} className="fd-trust-item">
                  <div className="fd-trust-dot-wrap">
                    <div className="fd-trust-dot" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  )
}
