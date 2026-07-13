import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — MIA Académie',
  description: "Politique de confidentialité et de protection des données personnelles de MIA Académie, conforme au RGPD.",
}

export default function PrivacyPage() {
  const updated = '1er juillet 2026'

  return (
    <article>
      <p style={styles.date}>Dernière mise à jour : {updated}</p>
      <h1 style={styles.h1}>Politique de Confidentialité</h1>
      <p style={styles.intro}>
        MIA Académie s&apos;engage à protéger la vie privée de ses utilisateurs conformément au Règlement Général
        sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et Libertés.
        La présente politique décrit quelles données nous collectons, pourquoi et comment nous les utilisons.
      </p>

      <Section title="1. Responsable du traitement">
        <p style={styles.p}><strong>MIA Académie</strong>, organisme de formation professionnelle continue.</p>
        <p style={styles.p}>
          Contact DPO / responsable des données :{' '}
          <a href="mailto:contact@mia-academie.com" style={styles.link}>contact@mia-academie.com</a>
        </p>
      </Section>

      <Section title="2. Données collectées">
        <p style={styles.p}>Nous collectons les données suivantes selon votre utilisation de la plateforme :</p>

        <h3 style={styles.h3}>Données d&apos;inscription et de compte</h3>
        <ul style={styles.ul}>
          <li>Nom, prénom, adresse email, numéro de téléphone</li>
          <li>Curriculum vitae (CV) si fourni lors de la candidature</li>
          <li>Mot de passe (stocké sous forme hashée, jamais en clair)</li>
        </ul>

        <h3 style={styles.h3}>Données liées à la formation</h3>
        <ul style={styles.ul}>
          <li>Résultats d&apos;évaluations, examens et modules suivis</li>
          <li>Documents contractuels signés (contrat, règlement intérieur, CGV)</li>
          <li>Bilans de satisfaction (bilan chaud et froid)</li>
          <li>Planning et assiduité aux sessions</li>
        </ul>

        <h3 style={styles.h3}>Données de navigation</h3>
        <ul style={styles.ul}>
          <li>Données d&apos;analyse de performance (via Vercel Analytics — anonymisées)</li>
          <li>Journaux de connexion (adresse IP, navigateur, date/heure)</li>
        </ul>
      </Section>

      <Section title="3. Finalités et bases légales">
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Finalité</th>
              <th style={styles.th}>Base légale</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Gestion des inscriptions et des comptes', 'Exécution du contrat'],
              ['Suivi pédagogique et délivrance des attestations', 'Obligation légale (art. L6353-1 Code du travail)'],
              ["Envoi d'emails transactionnels (convocations, documents)", 'Exécution du contrat'],
              ['Communication commerciale (newsletter, offres)', 'Consentement'],
              ['Amélioration de la plateforme (analytics)', 'Intérêt légitime'],
              ['Conservation des documents de formation (5 ans)', 'Obligation légale'],
            ].map(([f, b]) => (
              <tr key={f}>
                <td style={styles.td}>{f}</td>
                <td style={styles.td}><span style={styles.badge}>{b}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="4. Destinataires et sous-traitants">
        <p style={styles.p}>
          Vos données sont traitées par MIA Académie et ses sous-traitants techniques, dans le cadre strict
          des finalités décrites ci-dessus :
        </p>
        <ul style={styles.ul}>
          <li><strong>MongoDB Atlas</strong> (MongoDB Inc., USA) — base de données hébergée en EU</li>
          <li><strong>Vercel Inc.</strong> (USA) — hébergement de la plateforme, Analytics anonymisés</li>
          <li><strong>Cloudinary</strong> (USA) — stockage des fichiers et documents</li>
          <li><strong>Zoho Corporation</strong> — envoi des emails transactionnels</li>
          <li><strong>Google LLC</strong> — intégration Google Calendar pour la gestion des sessions</li>
        </ul>
        <p style={styles.p}>
          Ces sous-traitants sont liés par des clauses contractuelles conformes au RGPD. Aucune donnée
          n&apos;est vendue ou partagée à des fins publicitaires.
        </p>
      </Section>

      <Section title="5. Durée de conservation">
        <ul style={styles.ul}>
          <li><strong>Données de compte actif</strong> : pendant toute la durée de la relation contractuelle</li>
          <li><strong>Données après clôture du compte</strong> : 3 ans à compter de la dernière interaction</li>
          <li><strong>Documents de formation (attestations, contrats)</strong> : 5 ans (obligation légale)</li>
          <li><strong>Données de candidature non aboutie</strong> : 2 ans</li>
          <li><strong>Journaux de connexion</strong> : 12 mois</li>
        </ul>
      </Section>

      <Section title="6. Vos droits (RGPD)">
        <p style={styles.p}>
          Conformément au RGPD (articles 15 à 22), vous disposez des droits suivants sur vos données personnelles :
        </p>
        <ul style={styles.ul}>
          <li><strong>Droit d&apos;accès</strong> — obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
          <li><strong>Droit à l&apos;effacement</strong> — demander la suppression de vos données (« droit à l&apos;oubli »)</li>
          <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
          <li><strong>Droit d&apos;opposition</strong> — vous opposer à certains traitements (notamment à des fins commerciales)</li>
          <li><strong>Droit à la limitation</strong> — restreindre temporairement le traitement de vos données</li>
        </ul>
        <p style={styles.p}>
          Pour exercer ces droits, contactez-nous à{' '}
          <a href="mailto:contact@mia-academie.com" style={styles.link}>contact@mia-academie.com</a>.
          Nous nous engageons à répondre dans un délai d&apos;un mois.
        </p>
        <p style={styles.p}>
          Vous avez également le droit d&apos;introduire une réclamation auprès de la{' '}
          <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) :{' '}
          <a href="https://www.cnil.fr" style={styles.link} target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
        </p>
      </Section>

      <Section title="7. Cookies">
        <p style={styles.p}>
          La plateforme utilise uniquement des cookies strictement nécessaires à son fonctionnement :
        </p>
        <ul style={styles.ul}>
          <li><strong>Cookie de session d&apos;authentification</strong> — maintien de la connexion (durée : session)</li>
          <li><strong>Cookie CSRF</strong> — protection contre les attaques de type Cross-Site Request Forgery</li>
        </ul>
        <p style={styles.p}>
          Aucun cookie publicitaire ou de traçage tiers n&apos;est utilisé. Les données analytics Vercel sont
          collectées de manière anonymisée, sans identifiant individuel.
        </p>
      </Section>

      <Section title="8. Sécurité des données">
        <p style={styles.p}>
          MIA Académie met en œuvre des mesures techniques et organisationnelles appropriées pour protéger
          vos données : chiffrement des communications (HTTPS/TLS), hashage des mots de passe, contrôle
          d&apos;accès strict, en-têtes de sécurité (CSP, HSTS, X-Frame-Options).
        </p>
      </Section>

      <Section title="9. Modification de la politique">
        <p style={styles.p}>
          Nous nous réservons le droit de mettre à jour cette politique à tout moment. La date de dernière
          mise à jour est indiquée en haut de cette page. En cas de modification substantielle, vous serez
          notifié par email.
        </p>
      </Section>

      <Section title="10. Contact">
        <p style={styles.p}>
          Pour toute question relative à la protection de vos données :{' '}
          <a href="mailto:contact@mia-academie.com" style={styles.link}>contact@mia-academie.com</a>
        </p>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={styles.h2}>{title}</h2>
      {children}
    </section>
  )
}

const styles = {
  date:  { fontSize: 13, color: '#9ca3af', margin: '0 0 8px' } as React.CSSProperties,
  h1:    { fontSize: 28, fontWeight: 700, color: '#17171C', letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.2 } as React.CSSProperties,
  h2:    { fontSize: 16, fontWeight: 700, color: '#17171C', margin: '0 0 12px' } as React.CSSProperties,
  h3:    { fontSize: 14, fontWeight: 700, color: '#17171C', margin: '12px 0 6px' } as React.CSSProperties,
  intro: { fontSize: 15, color: '#4b5563', lineHeight: 1.75, margin: '0 0 40px', padding: '20px 24px', background: '#F3EDFF', borderRadius: 12, borderLeft: '3px solid #6B2BD9' } as React.CSSProperties,
  p:     { fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: '0 0 12px' } as React.CSSProperties,
  ul:    { fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: '0 0 12px', paddingLeft: 20 } as React.CSSProperties,
  link:  { color: '#6B2BD9', textDecoration: 'none' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13, margin: '0 0 12px' },
  th:    { background: '#f3f4f6', padding: '10px 14px', textAlign: 'left' as const, fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' },
  td:    { padding: '10px 14px', color: '#4b5563', borderBottom: '1px solid #f3f4f6', verticalAlign: 'top' as const },
  badge: { display: 'inline-block', background: '#F3EDFF', color: '#6B2BD9', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },
}
