import './planifier.css'
import type { Metadata } from 'next'
import { CalendarDays, MessageSquare, Zap } from 'lucide-react'
import SiteNav from '@/components/layout/site-nav'
import SiteFooter from '@/components/layout/site-footer'
import PlanifierForm from './_components/planifier-form'

export const metadata: Metadata = {
  title: 'Planifier un échange — MIA Académie',
  description: 'Réservez un créneau avec un conseiller MIA Académie pour discuter de votre projet de formation professionnelle.',
}

const BENEFITS = [
  {
    icon: Zap,
    title: 'Réponse rapide',
    desc: 'Un conseiller vous confirme le rendez-vous sous 24 h ouvrées.',
  },
  {
    icon: MessageSquare,
    title: 'Échange personnalisé',
    desc: 'Nous adaptons notre accompagnement à votre projet et vos contraintes.',
  },
  {
    icon: CalendarDays,
    title: 'Synchronisation Google Agenda',
    desc: "L'événement est créé directement dans votre Google Agenda après confirmation.",
  },
]

const STEPS = [
  'Remplissez le formulaire avec vos disponibilités.',
  'Recevez une confirmation par email sous 24 h.',
  "L'échange est ajouté à votre Google Agenda.",
  'Un conseiller vous rejoint au créneau convenu.',
]

const TRUST = [
  'Accompagnement gratuit et sans engagement',
  'Éligible CPF, OPCO et Pôle Emploi',
  'Formateurs certifiés et experts du terrain',
]

export default function PlanifierPage() {
  return (
    <div>
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="pl-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-fade" />
        <div className="pl-hero-content">
          <div className="pl-hero-badges">
            <span className="pl-badge-label">Rendez-vous conseil</span>
          </div>
          <h1 className="pl-hero-title font-heading">
            Parlons de votre<br />projet de formation
          </h1>
          <p className="pl-hero-sub">
            Choisissez un créneau et un conseiller vous rappelle pour discuter
            de vos objectifs, financements et options disponibles.
          </p>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="pl-body">
        <div className="pl-grid">

          {/* Left column — context & benefits */}
          <div>
            <h2 className="pl-section-title font-heading">Pourquoi prendre rendez-vous ?</h2>
            <p className="pl-desc">
              Nos conseillers vous accompagnent dans le choix de la formation adaptée,
              les modalités de financement (CPF, OPCO, Pôle Emploi) et les prochaines
              dates disponibles — sans engagement.
            </p>

            <div className="pl-benefits">
              {BENEFITS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="pl-benefit">
                  <div className="pl-benefit-icon">
                    <Icon size={17} color="var(--mia-purple)" />
                  </div>
                  <div>
                    <p className="pl-benefit-title">{title}</p>
                    <p className="pl-benefit-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pl-steps">
              <p className="pl-steps-label">Comment ça marche ?</p>
              <ol className="pl-steps-list">
                {STEPS.map((step, i) => (
                  <li key={i} className="pl-step">
                    <span className="pl-step-n">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right column — form card */}
          <div className="pl-sidebar">
            <div className="pl-card">
              <div className="pl-card-header">
                <p className="pl-card-header-label">Réserver un créneau</p>
                <p className="pl-card-header-title">Planifier un échange</p>
                <p className="pl-card-header-sub">Les champs marqués * sont obligatoires.</p>
              </div>

              <PlanifierForm />
            </div>

            <div className="pl-trust">
              {TRUST.map(item => (
                <div key={item} className="pl-trust-item">
                  <div className="pl-trust-dot-wrap">
                    <div className="pl-trust-dot" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
