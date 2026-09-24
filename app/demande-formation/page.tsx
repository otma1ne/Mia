import '../planifier/planifier.css'
import type { Metadata } from 'next'
import { GraduationCap, MessageSquare, Zap } from 'lucide-react'
import SiteNav from '@/components/layout/site-nav'
import SiteFooter from '@/components/layout/site-footer'
import { getLeadFormations } from '@/app/actions/leads'
import LeadForm from './_components/lead-form'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Demande d’information — MIA Académie',
  description: 'Parlez-nous de votre besoin de formation : un conseiller MIA Académie vous recontacte rapidement.',
}

const BENEFITS = [
  { icon: Zap,           title: 'Réponse rapide',          desc: 'Un conseiller vous recontacte sous 24 h ouvrées.' },
  { icon: GraduationCap, title: 'La bonne formation',      desc: 'Nous vous orientons vers le parcours adapté à votre objectif.' },
  { icon: MessageSquare, title: 'Offre sur mesure',        desc: 'Formations individuelles ou pour vos équipes en entreprise.' },
]

const TRUST = [
  'Accompagnement gratuit et sans engagement',
  'Formateurs certifiés et experts du terrain',
  'Formations en présentiel ou à distance',
]

export default async function DemandeFormationPage({
  searchParams,
}: {
  searchParams: Promise<{ formation?: string }>
}) {
  const { formation: preselected = '' } = await searchParams
  const formations = await getLeadFormations()

  return (
    <div>
      <SiteNav />

      <div className="pl-hero">
        <div className="pl-hero-glow" />
        <div className="pl-hero-fade" />
        <div className="pl-hero-content">
          <div className="pl-hero-badges">
            <span className="pl-badge-label">Demande d’information</span>
          </div>
          <h1 className="pl-hero-title font-heading">
            Quelle formation<br />vous intéresse ?
          </h1>
          <p className="pl-hero-sub">
            Laissez-nous vos coordonnées et votre besoin : nous revenons vers vous
            avec un programme, un tarif et les prochaines dates.
          </p>
        </div>
      </div>

      <div className="pl-body">
        <div className="pl-grid">
          <div>
            <h2 className="pl-section-title font-heading">Pourquoi nous contacter ?</h2>
            <p className="pl-desc">
              Que vous soyez particulier ou entreprise, nos conseillers vous aident à choisir
              la formation adaptée et à organiser votre parcours.
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
          </div>

          <div className="pl-sidebar">
            <div className="pl-card">
              <div className="pl-card-header">
                <p className="pl-card-header-label">Être recontacté</p>
                <p className="pl-card-header-title">Votre demande</p>
                <p className="pl-card-header-sub">Les champs marqués * sont obligatoires.</p>
              </div>
              <LeadForm
                preselected={preselected}
                formations={formations.map(f => ({ id: f.id, title: f.title, category: f.category?.name ?? '' }))}
              />
            </div>

            <div className="pl-trust">
              {TRUST.map(item => (
                <div key={item} className="pl-trust-item">
                  <div className="pl-trust-dot-wrap"><div className="pl-trust-dot" /></div>
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
