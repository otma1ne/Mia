import '../legal.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — MIA Académie',
  description: 'Politique de confidentialité et de protection des données personnelles de MIA Académie, conforme au RGPD.',
}

export default function PrivacyPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="lg-hero">
        <div className="lg-hero-glow" />
        <div className="lg-hero-fade" />
        <div className="lg-hero-content">
          <span className="lg-hero-badge">Légal</span>
          <h1 className="lg-hero-title font-heading">Politique de Confidentialité</h1>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="lg-body">
        <p className="lg-date">Dernière mise à jour : 1er juillet 2026</p>

        <p className="lg-intro">
          MIA Académie s&apos;engage à protéger la vie privée de ses utilisateurs conformément au
          Règlement Général sur la Protection des Données (<strong>RGPD — UE 2016/679</strong>) et
          à la loi Informatique et Libertés. Cette politique décrit les données collectées,
          leur utilisation et vos droits.
        </p>

        <section className="lg-section">
          <h2 className="lg-section-title">1. Responsable du traitement</h2>
          <p className="lg-p"><strong>MIA Académie</strong> — organisme de formation professionnelle continue.</p>
          <p className="lg-p">
            Contact :{' '}
            <a href="mailto:contact@mia-academie.com" className="lg-link">contact@mia-academie.com</a>
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">2. Données collectées</h2>

          <h3 className="lg-section-subtitle">Données d&apos;inscription et de compte</h3>
          <ul className="lg-ul">
            <li>Nom, prénom, adresse email, numéro de téléphone</li>
            <li>Curriculum vitae (CV) si fourni lors de la candidature</li>
            <li>Mot de passe (stocké sous forme hashée, jamais en clair)</li>
          </ul>

          <h3 className="lg-section-subtitle">Données liées à la formation</h3>
          <ul className="lg-ul">
            <li>Résultats d&apos;évaluations, examens et modules suivis</li>
            <li>Documents contractuels signés (contrat, règlement intérieur, CGV)</li>
            <li>Bilans de satisfaction (bilan chaud et froid)</li>
            <li>Planning et assiduité aux sessions</li>
          </ul>

          <h3 className="lg-section-subtitle">Données de navigation</h3>
          <ul className="lg-ul">
            <li>Analytics de performance via Vercel Analytics (anonymisées)</li>
            <li>Journaux de connexion (adresse IP, navigateur, date/heure)</li>
          </ul>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">3. Finalités et bases légales</h2>
          <div className="lg-table-wrap">
            <table className="lg-table">
              <thead>
                <tr>
                  <th>Finalité</th>
                  <th>Base légale</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Gestion des inscriptions et des comptes',               'Exécution du contrat'],
                  ['Suivi pédagogique et délivrance des attestations',      'Obligation légale (art. L6353-1 Code du travail)'],
                  ['Envoi d\'emails transactionnels (convocations, docs)', 'Exécution du contrat'],
                  ['Communication commerciale',                             'Consentement'],
                  ['Amélioration de la plateforme (analytics)',             'Intérêt légitime'],
                  ['Conservation des documents de formation (5 ans)',       'Obligation légale'],
                ].map(([f, b]) => (
                  <tr key={f}>
                    <td>{f}</td>
                    <td><span className="lg-badge">{b}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">4. Destinataires et sous-traitants</h2>
          <p className="lg-p">
            Vos données sont traitées exclusivement par MIA Académie et ses sous-traitants techniques,
            dans le cadre strict des finalités décrites ci-dessus :
          </p>
          <ul className="lg-ul">
            <li><strong>MongoDB Atlas</strong> — base de données hébergée en Europe</li>
            <li><strong>Vercel Inc.</strong> — hébergement de la plateforme et analytics anonymisés</li>
            <li><strong>Cloudinary</strong> — stockage des fichiers et documents</li>
            <li><strong>Zoho Corporation</strong> — envoi des emails transactionnels</li>
            <li><strong>Google LLC</strong> — intégration Google Calendar pour les sessions</li>
          </ul>
          <p className="lg-p">
            Aucune donnée n&apos;est vendue ou partagée à des fins publicitaires.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">5. Durée de conservation</h2>
          <ul className="lg-ul">
            <li><strong>Compte actif</strong> : pendant toute la durée de la relation contractuelle</li>
            <li><strong>Après clôture du compte</strong> : 3 ans à compter de la dernière interaction</li>
            <li><strong>Documents de formation</strong> : 5 ans (obligation légale)</li>
            <li><strong>Candidature non aboutie</strong> : 2 ans</li>
            <li><strong>Journaux de connexion</strong> : 12 mois</li>
          </ul>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">6. Vos droits (RGPD)</h2>
          <p className="lg-p">Conformément au RGPD (art. 15 à 22), vous disposez des droits suivants :</p>
          <ul className="lg-ul">
            <li><strong>Accès</strong> — obtenir une copie de vos données</li>
            <li><strong>Rectification</strong> — corriger des données inexactes</li>
            <li><strong>Effacement</strong> — demander la suppression (« droit à l&apos;oubli »)</li>
            <li><strong>Portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li><strong>Opposition</strong> — vous opposer à certains traitements</li>
            <li><strong>Limitation</strong> — restreindre temporairement le traitement</li>
          </ul>
          <p className="lg-p">
            Pour exercer ces droits :{' '}
            <a href="mailto:contact@mia-academie.com" className="lg-link">contact@mia-academie.com</a>.
            Nous nous engageons à répondre dans un délai d&apos;un mois.
          </p>
          <p className="lg-p">
            Vous pouvez également saisir la{' '}
            <strong>CNIL</strong> :{' '}
            <a href="https://www.cnil.fr" className="lg-link" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">7. Cookies</h2>
          <p className="lg-p">La plateforme utilise uniquement des cookies strictement nécessaires :</p>
          <ul className="lg-ul">
            <li><strong>Cookie de session</strong> — maintien de la connexion (durée : session)</li>
            <li><strong>Cookie CSRF</strong> — protection contre les attaques Cross-Site Request Forgery</li>
          </ul>
          <p className="lg-p">
            Aucun cookie publicitaire ou de traçage tiers n&apos;est utilisé.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">8. Sécurité des données</h2>
          <p className="lg-p">
            MIA Académie met en œuvre des mesures techniques appropriées : chiffrement HTTPS/TLS,
            hashage des mots de passe, contrôle d&apos;accès strict, en-têtes de sécurité
            (CSP, HSTS, X-Frame-Options).
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">9. Modification de la politique</h2>
          <p className="lg-p">
            Nous nous réservons le droit de mettre à jour cette politique à tout moment.
            La date de dernière mise à jour est indiquée en haut de cette page.
            En cas de modification substantielle, vous serez notifié par email.
          </p>
        </section>

        <section className="lg-section">
          <h2 className="lg-section-title">10. Contact</h2>
          <p className="lg-p">
            Pour toute question :{' '}
            <a href="mailto:contact@mia-academie.com" className="lg-link">contact@mia-academie.com</a>
          </p>
        </section>
      </div>
    </>
  )
}
