import '../legal.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — MIA Académie",
  description: "Conditions générales d'utilisation de la plateforme MIA Académie, organisme de formation professionnelle.",
}

export default function TermsPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="lg-hero">
        <div className="lg-hero-glow" />
        <div className="lg-hero-fade" />
        <div className="lg-hero-content">
          <span className="lg-hero-badge">Légal</span>
          <h1 className="lg-hero-title font-heading">Conditions Générales d&apos;Utilisation</h1>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="lg-body">
        <p className="lg-date">Dernière mise à jour : 1er juillet 2026</p>

        <p className="lg-intro">
          Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
          de la plateforme <strong>MIA Académie</strong>, accessible à l&apos;adresse{' '}
          <a href="https://www.mia-academie.com" className="lg-link">www.mia-academie.com</a>.
          En accédant à la plateforme, vous acceptez sans réserve les présentes CGU.
        </p>

        <section className="lg-section">
          <h2 className="lg-section-title">1. Éditeur de la plateforme</h2>
          <p className="lg-p">
            La plateforme est éditée par <strong>MIA Académie</strong>, organisme de formation professionnelle continue.
          </p>
          <p className="lg-p">
            Contact : <a href="mailto:contact@mia-academie.com" className="lg-link">contact@mia-academie.com</a>
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">2. Objet</h2>
          <p className="lg-p">
            MIA Académie est une plateforme de formation professionnelle permettant aux apprenants de suivre
            des programmes certifiés, d&apos;accéder à des ressources pédagogiques et de gérer leur parcours de formation.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">3. Accès à la plateforme</h2>
          <p className="lg-p">
            L&apos;accès à l&apos;espace personnel est réservé aux utilisateurs disposant d&apos;un compte valide, créé
            à l&apos;issue d&apos;une inscription acceptée par MIA Académie. L&apos;utilisateur est responsable de la
            confidentialité de ses identifiants et s&apos;engage à ne pas les communiquer à des tiers.
          </p>
          <p className="lg-p">
            MIA Académie se réserve le droit de suspendre ou de résilier un compte en cas de non-respect
            des présentes CGU, sans préavis ni indemnité.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">4. Utilisation acceptable</h2>
          <p className="lg-p">L&apos;utilisateur s&apos;engage à utiliser la plateforme dans le respect des lois en vigueur et à ne pas :</p>
          <ul className="lg-ul">
            <li>Reproduire ou distribuer les contenus pédagogiques sans autorisation écrite préalable ;</li>
            <li>Accéder aux comptes d&apos;autres utilisateurs ou contourner les mesures de sécurité ;</li>
            <li>Utiliser la plateforme à des fins commerciales non autorisées ;</li>
            <li>Publier des contenus illicites, diffamatoires ou portant atteinte aux droits de tiers.</li>
          </ul>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">5. Propriété intellectuelle</h2>
          <p className="lg-p">
            L&apos;ensemble des contenus disponibles sur la plateforme (textes, vidéos, supports de cours, logos,
            interfaces) sont la propriété exclusive de MIA Académie ou de ses partenaires et sont protégés
            par le droit d&apos;auteur. Toute reproduction non autorisée est strictement interdite.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">6. Disponibilité du service</h2>
          <p className="lg-p">
            MIA Académie s&apos;efforce d&apos;assurer la disponibilité de la plateforme 24h/24 et 7j/7, mais ne peut
            garantir une disponibilité ininterrompue. Des interruptions pourront survenir pour maintenance
            ou en cas de force majeure.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">7. Limitation de responsabilité</h2>
          <p className="lg-p">
            MIA Académie ne saurait être tenue responsable des dommages directs ou indirects résultant
            de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser la plateforme, d&apos;une erreur dans les contenus,
            ou d&apos;une intrusion ou virus informatique.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">8. Modification des CGU</h2>
          <p className="lg-p">
            MIA Académie se réserve le droit de modifier les présentes CGU à tout moment. Les modifications
            entrent en vigueur dès leur publication. L&apos;utilisation continue de la plateforme après modification
            vaut acceptation des nouvelles CGU.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">9. Droit applicable</h2>
          <p className="lg-p">
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;efforceront
            de trouver une solution amiable avant tout recours judiciaire. À défaut, les tribunaux français
            seront compétents.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">10. Contact</h2>
          <p className="lg-p">
            Pour toute question relative aux présentes CGU :{' '}
            <a href="mailto:contact@mia-academie.com" className="lg-link">contact@mia-academie.com</a>
          </p>
        </section>
      </div>
    </>
  )
}
