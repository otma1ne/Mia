import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — MIA Académie",
  description: "Conditions générales d'utilisation de la plateforme MIA Académie, organisme de formation professionnelle.",
}

export default function TermsPage() {
  const updated = '1er juillet 2026'

  return (
    <article>
      <p style={styles.date}>Dernière mise à jour : {updated}</p>
      <h1 style={styles.h1}>Conditions Générales d&apos;Utilisation</h1>
      <p style={styles.intro}>
        Les présentes Conditions Générales d&apos;Utilisation (ci-après « CGU ») régissent l&apos;accès et l&apos;utilisation
        de la plateforme <strong>MIA Académie</strong>, accessible à l&apos;adresse{' '}
        <a href="https://www.mia-academie.com" style={styles.link}>www.mia-academie.com</a>.
        En accédant à la plateforme, vous acceptez sans réserve les présentes CGU.
      </p>

      <Section title="1. Éditeur de la plateforme">
        <p style={styles.p}>
          La plateforme est éditée par <strong>MIA Académie</strong>, organisme de formation professionnelle continue.
        </p>
        <p style={styles.p}>
          Contact : <a href="mailto:contact@mia-academie.com" style={styles.link}>contact@mia-academie.com</a>
        </p>
      </Section>

      <Section title="2. Objet">
        <p style={styles.p}>
          MIA Académie est une plateforme de formation professionnelle en ligne permettant aux apprenants de suivre
          des programmes certifiés, d&apos;accéder à des ressources pédagogiques et de gérer leur parcours de formation.
        </p>
      </Section>

      <Section title="3. Accès à la plateforme">
        <p style={styles.p}>
          L&apos;accès à l&apos;espace personnel est réservé aux utilisateurs disposant d&apos;un compte valide créé à l&apos;issue
          d&apos;une inscription acceptée par MIA Académie. L&apos;utilisateur est responsable de la confidentialité de ses
          identifiants de connexion et s&apos;engage à ne pas les communiquer à des tiers.
        </p>
        <p style={styles.p}>
          MIA Académie se réserve le droit de suspendre ou de résilier un compte en cas de non-respect des
          présentes CGU, sans préavis ni indemnité.
        </p>
      </Section>

      <Section title="4. Utilisation acceptable">
        <p style={styles.p}>L&apos;utilisateur s&apos;engage à utiliser la plateforme dans le respect des lois en vigueur et à ne pas :</p>
        <ul style={styles.ul}>
          <li>Reproduire, copier ou distribuer les contenus pédagogiques sans autorisation écrite préalable ;</li>
          <li>Accéder aux comptes d&apos;autres utilisateurs ou tenter de contourner les mesures de sécurité ;</li>
          <li>Utiliser la plateforme à des fins commerciales non autorisées ;</li>
          <li>Publier des contenus illicites, diffamatoires, discriminatoires ou portant atteinte aux droits de tiers.</li>
        </ul>
      </Section>

      <Section title="5. Propriété intellectuelle">
        <p style={styles.p}>
          L&apos;ensemble des contenus disponibles sur la plateforme (textes, vidéos, supports de cours, logos, interfaces)
          sont la propriété exclusive de MIA Académie ou de ses partenaires et sont protégés par le droit d&apos;auteur.
          Toute reproduction ou exploitation non autorisée est strictement interdite.
        </p>
      </Section>

      <Section title="6. Disponibilité du service">
        <p style={styles.p}>
          MIA Académie s&apos;efforce d&apos;assurer la disponibilité de la plateforme 24h/24 et 7j/7, mais ne peut garantir
          une disponibilité ininterrompue. Des interruptions de service pourront survenir pour des opérations de
          maintenance ou en cas de force majeure.
        </p>
      </Section>

      <Section title="7. Limitation de responsabilité">
        <p style={styles.p}>
          MIA Académie ne saurait être tenue responsable des dommages directs ou indirects résultant de l&apos;utilisation
          ou de l&apos;impossibilité d&apos;utiliser la plateforme, d&apos;une erreur ou d&apos;une omission dans les contenus proposés,
          ou d&apos;une intrusion extérieure ou d&apos;un virus informatique.
        </p>
      </Section>

      <Section title="8. Modification des CGU">
        <p style={styles.p}>
          MIA Académie se réserve le droit de modifier les présentes CGU à tout moment. Les modifications entrent
          en vigueur dès leur publication sur la plateforme. L&apos;utilisation continue de la plateforme après modification
          vaut acceptation des nouvelles CGU.
        </p>
      </Section>

      <Section title="9. Droit applicable">
        <p style={styles.p}>
          Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;efforceront de trouver
          une solution amiable avant tout recours judiciaire. À défaut, les tribunaux français seront compétents.
        </p>
      </Section>

      <Section title="10. Contact">
        <p style={styles.p}>
          Pour toute question relative aux présentes CGU :{' '}
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
  date: { fontSize: 13, color: '#9ca3af', margin: '0 0 8px' } as React.CSSProperties,
  h1:   { fontSize: 28, fontWeight: 700, color: '#17171C', letterSpacing: '-0.02em', margin: '0 0 16px', lineHeight: 1.2 } as React.CSSProperties,
  h2:   { fontSize: 16, fontWeight: 700, color: '#17171C', margin: '0 0 10px' } as React.CSSProperties,
  intro:{ fontSize: 15, color: '#4b5563', lineHeight: 1.75, margin: '0 0 40px', padding: '20px 24px', background: '#F3EDFF', borderRadius: 12, borderLeft: '3px solid #6B2BD9' } as React.CSSProperties,
  p:    { fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: '0 0 12px' } as React.CSSProperties,
  ul:   { fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: '0 0 12px', paddingLeft: 20 } as React.CSSProperties,
  link: { color: '#6B2BD9', textDecoration: 'none' } as React.CSSProperties,
}
