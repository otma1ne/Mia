import nodemailer from 'nodemailer'
import type { PlanifierInput } from '@/app/actions/planifier'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM        = process.env.SMTP_FROM    ?? 'MIA Académie <noreply@mia-academie.com>'
const CONTACT_TO  = process.env.CONTACT_EMAIL ?? 'contact@mia-academie.com'
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const PORTAL_HOST = APP_URL.replace(/^https?:\/\//, '')
const LOGO_URL     = `${APP_URL}/logo.png`

// ─── Design system tokens ────────────────────────────────────────────────────
const PURPLE      = '#6B2BD9'
const NEAR_BK      = '#17171C'
const DARK_CARD_BOX = '#23232B'
const BADGE_BG     = '#F3EDFF'
const FONT         = "-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif"

// ─── Header / footer (MIA brand template) ──────────────────────────────────────

function header() {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #eef0f3;">
      <tr>
        <td style="padding:24px 36px;vertical-align:middle;">
          <img src="${LOGO_URL}" alt="MIA" height="26" style="display:block;border:0;" />
        </td>
      </tr>
    </table>
  `
}

function contactBand(html: string) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-top:1px solid #f0f0f0;">
      <tr><td style="padding:16px 36px;text-align:center;">
        <p style="margin:0;font-size:13px;color:#6b7280;">${html}</p>
      </td></tr>
    </table>
  `
}

function bottomFooter() {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding:28px 36px;text-align:center;">
        <img src="${LOGO_URL}" alt="MIA" height="20" style="display:inline-block;margin-bottom:10px;border:0;" />
        <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">MIA Académie · Centre de formation professionnelle</p>
        <p style="margin:0;font-size:11px;color:#c1c5cb;">
          <a href="${APP_URL}/courses" style="color:#c1c5cb;text-decoration:none;">Centre d'aide</a>
          &nbsp;·&nbsp;
          <a href="${APP_URL}" style="color:#c1c5cb;text-decoration:none;">Confidentialité</a>
        </p>
      </td></tr>
    </table>
  `
}

// Wraps every email in the consistent MIA brand card
function shell(content: string, contactLine?: string) {
  const defaultContact = `Une question ? Contactez notre équipe à <a href="mailto:${CONTACT_TO}" style="color:${PURPLE};font-weight:600;text-decoration:none;">${CONTACT_TO}</a>`
  return `
    <div style="font-family:${FONT};max-width:580px;margin:0 auto;color:${NEAR_BK};background:#f6f6f9;padding:32px 16px;">
      <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.03);">
        ${header()}
        <div style="padding:32px 36px 28px;">
          ${content}
        </div>
        ${contactBand(contactLine ?? defaultContact)}
      </div>
      ${bottomFooter()}
    </div>
  `
}

// ─── Reusable blocks ──────────────────────────────────────────────────────────

function badge(text: string) {
  return `
    <div style="margin:0 0 18px;">
      <span style="display:inline-block;background:${BADGE_BG};color:${PURPLE};font-size:11px;font-weight:700;
                   letter-spacing:0.06em;text-transform:uppercase;padding:6px 14px;border-radius:20px;">
        ${text}
      </span>
    </div>
  `
}

function heading(text: string) {
  return `<h1 style="margin:0 0 16px;font-size:28px;line-height:1.22;font-weight:600;color:${NEAR_BK};letter-spacing:-0.02em;">${text}</h1>`
}

function para(text: string) {
  return `<p style="font-size:14px;color:#4b5563;line-height:1.75;margin:0 0 16px;">${text}</p>`
}

function btn(href: string, label: string, color = PURPLE) {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}"
         style="display:inline-block;background:${color};color:#fff;text-decoration:none;
                padding:14px 36px;border-radius:32px;font-weight:700;font-size:14px;
                letter-spacing:-0.01em;">
        ${label}
      </a>
    </div>
  `
}

function infoBox(content: string, bg = '#F5F0FF', border = 'rgba(107,43,217,0.15)') {
  return `
    <div style="background:${bg};border:1px solid ${border};border-radius:12px;
                padding:20px 24px;margin:20px 0;">
      ${content}
    </div>
  `
}

// Dark credentials card — matches the MIA brand template exactly
function credentialsCard(params: {
  username: string
  password: string
  buttonHref: string
  buttonLabel?: string
  portalLabel?: string
}) {
  const { username, password, buttonHref, buttonLabel = 'Accéder à mon espace', portalLabel = 'Portail' } = params
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NEAR_BK};border-radius:16px;margin:24px 0;">
      <tr><td style="padding:28px 28px 26px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);">
          Vos identifiants de connexion
        </p>
        <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.45);">${portalLabel}</p>
        <p style="margin:0 0 18px;font-size:14px;font-weight:600;color:#fff;">${PORTAL_HOST}</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="48%" style="background:${DARK_CARD_BOX};border-radius:10px;padding:14px 16px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.4);">Identifiant</p>
              <p style="margin:0;font-size:14px;font-weight:700;color:#fff;word-break:break-all;">${username}</p>
            </td>
            <td width="4%">&nbsp;</td>
            <td width="48%" style="background:${DARK_CARD_BOX};border-radius:10px;padding:14px 16px;vertical-align:top;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.4);">Mot de passe temporaire</p>
              <p style="margin:0;font-size:14px;font-weight:700;font-family:monospace;letter-spacing:1px;color:#fff;">${password}</p>
            </td>
          </tr>
        </table>

        <div style="text-align:center;margin-top:22px;">
          <a href="${buttonHref}"
             style="display:inline-block;background:${PURPLE};color:#fff;text-decoration:none;
                    padding:13px 34px;border-radius:32px;font-weight:700;font-size:14px;">
            ${buttonLabel}
          </a>
        </div>
      </td></tr>
    </table>
  `
}

function nextSteps(title: string, items: { title: string; desc: string }[]) {
  const rows = items.map((it, i) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td width="32" style="vertical-align:top;">
          <div style="width:24px;height:24px;border-radius:50%;background:${BADGE_BG};color:${PURPLE};
                      font-size:12px;font-weight:800;text-align:center;line-height:24px;">${i + 1}</div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:${NEAR_BK};">${it.title}</p>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">${it.desc}</p>
        </td>
      </tr>
    </table>
  `).join('')

  return `
    <p style="margin:28px 0 16px;font-size:16px;font-weight:700;color:${NEAR_BK};">${title}</p>
    ${rows}
  `
}

function warningNote(text: string) {
  return `<p style="font-size:12px;color:#6b7280;margin:16px 0 0;line-height:1.6;">⚠️ ${text}</p>`
}

function divider() {
  return `<div style="height:1px;background:#f3f4f6;margin:24px 0;"></div>`
}

// ─── Email functions ───────────────────────────────────────────────────────────

export async function sendEvaluationEmail(to: string, firstName: string, token: string) {
  const link = `${APP_URL}/evaluation/${token}`

  await transporter.sendMail({
    from: FROM, to,
    subject: 'Complétez votre évaluation de besoins — MIA Académie',
    html: shell(`
      ${badge('Évaluation requise')}
      ${heading(`Une dernière étape, ${firstName}.`)}
      ${para('Merci pour votre demande d\'inscription. Afin de mieux vous accompagner, nous avons besoin de quelques informations complémentaires.')}
      ${para('Veuillez compléter votre <strong>évaluation de besoins</strong> en cliquant sur le bouton ci-dessous.')}
      ${btn(link, 'Compléter l\'évaluation')}
      ${warningNote('Ce lien est valable pendant <strong>24 heures</strong>. Passé ce délai, vous devrez soumettre une nouvelle demande d\'inscription.')}
    `),
  })
}

export async function sendSignatureRequestEmail(to: string, firstName: string, token: string) {
  const link = `${APP_URL}/signature/${token}`

  await transporter.sendMail({
    from: FROM, to,
    subject: 'Documents à signer — MIA Académie',
    html: shell(`
      ${badge('Documents à signer')}
      ${heading(`Plus qu'une étape, ${firstName}.`)}
      ${para('Votre candidature a été <strong>acceptée</strong>. Pour finaliser votre inscription, merci de consulter et signer électroniquement vos documents contractuels.')}
      ${infoBox(`
        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
          Documents inclus : contrat de formation, règlement intérieur, CGV, programme de formation.
        </p>
      `)}
      ${btn(link, 'Consulter et signer mes documents')}
      ${warningNote('Ce lien est valable pendant <strong>7 jours</strong>. Passé ce délai, contactez notre équipe pour recevoir un nouveau lien.')}
    `),
  })
}

export async function sendAcceptanceEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  generatedPassword: string
) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM, to,
    subject: '🎉 Votre candidature a été acceptée — MIA Académie',
    html: shell(`
      ${badge('Candidature validée')}
      ${heading(`Bienvenue dans la promotion, ${firstName}.`)}
      ${para(`Votre candidature pour la formation <strong>${formationTitle}</strong> a été <strong style="color:#16a34a;">acceptée</strong>. Votre compte est prêt — voici vos identifiants de connexion.`)}
      ${credentialsCard({ username: to, password: generatedPassword, buttonHref: loginUrl, portalLabel: 'Espace étudiant' })}
      ${nextSteps('Vos prochaines étapes', [
        { title: 'Connectez-vous et changez votre mot de passe', desc: 'Utilisez les identifiants ci-dessus pour accéder à votre espace.' },
        { title: 'Complétez votre profil', desc: 'Ajoutez vos informations pour un meilleur accompagnement.' },
        { title: 'Consultez votre planning', desc: 'Retrouvez les dates et horaires de votre formation.' },
      ])}
    `),
  })
}

export async function sendEnrollmentConfirmationEmail(
  to: string,
  firstName: string,
  formationTitle: string
) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM, to,
    subject: `Votre inscription à ${formationTitle} est confirmée — MIA Académie`,
    html: shell(`
      ${badge('Inscription confirmée')}
      ${heading(`C'est confirmé, ${firstName} !`)}
      ${para(`Votre inscription à la formation <strong>${formationTitle}</strong> est maintenant <strong style="color:#16a34a;">confirmée</strong>. 🎉`)}
      ${para('Vous pouvez dès à présent accéder à votre espace étudiant pour suivre vos cours.')}
      ${btn(loginUrl, 'Accéder à mon espace', '#16a34a')}
    `),
  })
}

export async function sendTrainerWelcomeEmail(to: string, name: string, password: string) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM, to,
    subject: 'Bienvenue sur MIA Académie — vos identifiants de connexion',
    html: shell(`
      ${badge('Compte formateur')}
      ${heading(`Bienvenue dans l'équipe, ${name}.`)}
      ${para('Votre compte <strong>formateur</strong> a été créé sur <strong>MIA Académie</strong>. Voici vos identifiants de connexion.')}
      ${credentialsCard({ username: to, password, buttonHref: loginUrl, portalLabel: 'Espace formateur' })}
      ${nextSteps('Vos prochaines étapes', [
        { title: 'Connectez-vous et changez votre mot de passe', desc: 'Utilisez les identifiants ci-dessus pour accéder à votre espace.' },
        { title: 'Découvrez vos modules', desc: 'Consultez les formations qui vous sont assignées.' },
        { title: 'Préparez votre planning', desc: 'Vérifiez vos prochaines sessions de formation.' },
      ])}
    `),
  })
}

export async function sendDeclineEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  adminNote?: string
) {
  await transporter.sendMail({
    from: FROM, to,
    subject: 'Suite à votre candidature — MIA Académie',
    html: shell(`
      ${badge('Candidature étudiée')}
      ${heading(`Concernant votre candidature, ${firstName}.`)}
      ${para(`Nous avons bien étudié votre candidature pour la formation <strong>${formationTitle}</strong>.`)}
      ${para('Après examen de votre dossier, nous ne sommes malheureusement pas en mesure de donner suite à votre demande pour le moment.')}
      ${adminNote ? infoBox(`
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">Message de notre équipe</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.65;">${adminNote}</p>
      `, '#FFFBEB', '#FCD34D') : ''}
      ${para('Nous vous encourageons à consulter nos autres formations disponibles et à soumettre une nouvelle candidature à tout moment.')}
      ${btn(`${APP_URL}/formations`, 'Voir les autres formations')}
    `),
  })
}

export async function sendBilanChaudEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  token: string
) {
  const link = `${APP_URL}/bilan/${token}`

  await transporter.sendMail({
    from: FROM, to,
    subject: '📋 Votre avis sur la formation — MIA Académie',
    html: shell(`
      ${badge('Bilan chaud')}
      ${heading(`Votre avis compte, ${firstName}.`)}
      ${para(`Félicitations ! Vous avez terminé votre formation <strong>${formationTitle}</strong>. 🎉`)}
      ${para('Nous aimerions connaître votre retour sur cette expérience. Veuillez compléter le formulaire ci-dessous (environ 5 minutes).')}
      ${btn(link, 'Compléter mon Bilan Chaud')}
      ${warningNote('Ce lien est valable pendant <strong>30 jours</strong>. Passé ce délai, vous ne pourrez plus répondre.')}
    `),
  })
}

export async function sendBilanFroidEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  token: string
) {
  const link = `${APP_URL}/bilan/${token}`

  await transporter.sendMail({
    from: FROM, to,
    subject: '📋 Suivi de votre formation — MIA Académie',
    html: shell(`
      ${badge('Bilan froid')}
      ${heading(`Des nouvelles de votre parcours, ${firstName} ?`)}
      ${para(`Cela fait 3 mois que vous avez terminé votre formation <strong>${formationTitle}</strong>.`)}
      ${para('Nous aimerions savoir comment vous appliquez vos apprentissages dans la pratique. Veuillez compléter ce formulaire de suivi (environ 5 minutes).')}
      ${btn(link, 'Compléter mon Bilan Froid')}
      ${warningNote('Ce lien est valable pendant <strong>30 jours</strong>.')}
    `),
  })
}

export async function sendBilanReminderEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  token: string,
  type: 'CHAUD' | 'FROID'
) {
  const link   = `${APP_URL}/bilan/${token}`
  const title  = type === 'CHAUD' ? 'Bilan Chaud' : 'Bilan Froid'
  const detail = type === 'CHAUD'
    ? 'Veuillez compléter votre évaluation de la formation.'
    : 'Veuillez compléter votre suivi de formation.'

  await transporter.sendMail({
    from: FROM, to,
    subject: `⏰ Rappel : ${title} — ${formationTitle}`,
    html: shell(`
      ${badge('Rappel')}
      ${heading(`N'oubliez pas votre ${title}, ${firstName}.`)}
      ${para(`Nous avons remarqué que vous n'avez pas encore complété votre <strong>${title}</strong> pour la formation <strong>${formationTitle}</strong>.`)}
      ${para(detail)}
      ${btn(link, 'Compléter maintenant', '#F59E0B')}
      ${warningNote('Ce lien expire dans les prochains jours.')}
    `),
  })
}

export async function sendAttestationEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  attestationUrl: string
) {
  const dashboardUrl = `${APP_URL}/student/documents`

  await transporter.sendMail({
    from: FROM, to,
    subject: `🎓 Votre attestation de fin de formation — ${formationTitle}`,
    html: shell(`
      ${badge('Formation terminée')}
      ${heading(`Félicitations, ${firstName} ! 🎓`)}
      ${para(`Vous avez terminé avec succès la formation <strong>${formationTitle}</strong>.`)}
      ${para('Votre <strong>attestation de fin de formation</strong> (certificat de réalisation) est maintenant disponible. Vous pouvez la télécharger directement ci-dessous ou depuis votre espace étudiant.')}
      ${btn(attestationUrl, 'Télécharger mon attestation', '#16a34a')}
      ${divider()}
      ${btn(dashboardUrl, 'Mon espace documents')}
      ${warningNote('Ce document est votre certificat de réalisation officiel, conformément à l\'article L6353-1 du Code du travail.')}
    `),
  })
}

export async function sendConvocationEmail(params: {
  to: string
  firstName: string
  formationTitle: string
  moduleName: string
  sessionDate: Date
  startTime: string
  endTime: string
  trainerName?: string | null
  roomName?: string | null
  formationType: string
  notes?: string | null
}) {
  const {
    to, firstName, formationTitle, moduleName,
    sessionDate, startTime, endTime, trainerName,
    roomName, formationType, notes,
  } = params

  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(sessionDate))

  const isRemote = formationType !== 'PRESENTIAL'
  const locationLine = isRemote
    ? `<p style="margin:6px 0 0;font-size:13px;color:#1d4ed8;">📡 <strong>Session à distance</strong></p>`
    : roomName
      ? `<p style="margin:6px 0 0;font-size:13px;color:#374151;">📍 Salle : <strong>${roomName}</strong></p>`
      : `<p style="margin:6px 0 0;font-size:13px;color:#374151;">📍 En présentiel</p>`

  const dashboardUrl = `${APP_URL}/student/schedule`

  await transporter.sendMail({
    from: FROM, to,
    subject: `📅 Convocation — ${formationTitle} — ${dateStr}`,
    html: shell(`
      ${badge('Convocation')}
      ${heading(`Votre prochaine session, ${firstName}.`)}
      ${para(`Vous êtes convoqué(e) à la session suivante dans le cadre de votre formation <strong>${formationTitle}</strong>.`)}
      ${infoBox(`
        <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:${NEAR_BK};">${moduleName}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#374151;">📅 <strong>${dateStr}</strong></p>
        <p style="margin:0 0 4px;font-size:13px;color:#374151;">🕐 De <strong>${startTime}</strong> à <strong>${endTime}</strong></p>
        ${locationLine}
        ${trainerName ? `<p style="margin:6px 0 0;font-size:13px;color:#374151;">👤 Formateur : <strong>${trainerName}</strong></p>` : ''}
        ${notes ? `${divider()}<p style="margin:0;font-size:12px;color:#6b7280;font-style:italic;line-height:1.6;">${notes}</p>` : ''}
      `, '#EFF6FF', '#BFDBFE')}
      ${para('Merci d\'être présent(e) à l\'heure. En cas d\'empêchement, veuillez contacter votre centre de formation dès que possible.')}
      ${btn(dashboardUrl, 'Voir mon planning')}
    `),
  })
}

export async function sendGradingNotificationEmail(params: {
  to: string
  trainerName: string
  studentName: string
  formationTitle: string
  moduleName: string
  gradingUrl: string
}) {
  const { to, trainerName, studentName, formationTitle, moduleName, gradingUrl } = params

  await transporter.sendMail({
    from: FROM, to,
    subject: `📝 Correction requise — ${moduleName} — MIA Académie`,
    html: shell(`
      ${badge('Correction requise')}
      ${heading(`Une copie vous attend, ${trainerName}.`)}
      ${para('Un étudiant vient de soumettre un examen contenant des <strong>questions ouvertes</strong> qui nécessitent votre correction.')}
      ${infoBox(`
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.06em;">Détails</p>
        <p style="margin:0 0 4px;font-size:13px;color:#374151;">👤 Étudiant : <strong>${studentName}</strong></p>
        <p style="margin:0 0 4px;font-size:13px;color:#374151;">📚 Formation : <strong>${formationTitle}</strong></p>
        <p style="margin:0;font-size:13px;color:#374151;">📋 Module : <strong>${moduleName}</strong></p>
      `, '#FFFBEB', '#FCD34D')}
      ${para('Veuillez vous connecter à votre espace pour consulter et noter les réponses ouvertes.')}
      ${btn(gradingUrl, 'Corriger les réponses')}
    `),
  })
}

export async function sendCommercialWelcomeEmail(to: string, name: string, password: string) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM, to,
    subject: 'Bienvenue sur MIA Académie — votre espace commercial',
    html: shell(`
      ${badge('Compte commercial')}
      ${heading(`Bienvenue dans l'équipe, ${name}.`)}
      ${para('Votre compte <strong>commercial</strong> a été créé sur <strong>MIA Académie</strong>. Voici vos identifiants de connexion.')}
      ${credentialsCard({ username: to, password, buttonHref: loginUrl, portalLabel: 'Espace commercial' })}
      ${nextSteps('Vos prochaines étapes', [
        { title: 'Connectez-vous et changez votre mot de passe', desc: 'Utilisez les identifiants ci-dessus pour accéder à votre espace.' },
        { title: 'Découvrez votre tableau de bord', desc: 'Suivez les candidatures et inscriptions en cours.' },
        { title: 'Configurez vos préférences', desc: 'Personnalisez vos notifications et votre profil.' },
      ])}
    `),
  })
}

export async function sendCompanyWelcomeEmail(
  to: string,
  nomDirigeant: string,
  prenomDirigeant: string,
  raisonSociale: string,
  password: string,
) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM, to,
    subject: `Bienvenue sur MIA Académie — espace entreprise ${raisonSociale}`,
    html: shell(`
      ${badge('Espace entreprise')}
      ${heading(`Bienvenue, ${prenomDirigeant} ${nomDirigeant}.`)}
      ${para(`Votre espace entreprise <strong>${raisonSociale}</strong> a été créé sur <strong>MIA Académie</strong>. Voici vos identifiants de connexion.`)}
      ${credentialsCard({ username: to, password, buttonHref: loginUrl, portalLabel: 'Espace entreprise' })}
      ${nextSteps('Vos prochaines étapes', [
        { title: 'Connectez-vous à votre espace', desc: 'Utilisez les identifiants ci-dessus pour accéder à votre tableau de bord entreprise.' },
        { title: 'Consultez vos formations', desc: 'Retrouvez les sessions de formation, les dates et les modalités.' },
        { title: 'Gérez vos salariés', desc: 'Visualisez la liste des salariés inscrits et leurs documents.' },
      ])}
    `),
  })
}

// ── Planifier un échange — notification to admin ──────────────────────────────

export async function sendPlanifierNotification(input: PlanifierInput) {
  const DAY_LABELS: Record<number, string> = {
    0: 'Dimanche', 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi',
    4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi',
  }
  const d        = new Date(input.date)
  const dayLabel = `${DAY_LABELS[d.getDay()]} ${d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`

  await transporter.sendMail({
    from:    FROM,
    to:      CONTACT_TO,
    replyTo: input.email,
    subject: `📅 Nouvelle demande de RDV — ${input.firstName} ${input.lastName}`,
    html: shell(`
      ${badge('Nouvelle demande')}
      ${heading('Nouveau rendez-vous à planifier.')}
      ${infoBox(`
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr>
            <td style="padding:7px 0;color:#6b7280;width:120px;vertical-align:top;">Nom</td>
            <td style="padding:7px 0;color:${NEAR_BK};font-weight:600;">${input.firstName} ${input.lastName}</td>
          </tr>
          <tr style="border-top:1px solid rgba(107,43,217,0.08);">
            <td style="padding:7px 0;color:#6b7280;">Email</td>
            <td style="padding:7px 0;"><a href="mailto:${input.email}" style="color:${PURPLE};font-weight:600;text-decoration:none;">${input.email}</a></td>
          </tr>
          <tr style="border-top:1px solid rgba(107,43,217,0.08);">
            <td style="padding:7px 0;color:#6b7280;">Téléphone</td>
            <td style="padding:7px 0;color:${NEAR_BK};">${input.phone || '—'}</td>
          </tr>
          <tr style="border-top:1px solid rgba(107,43,217,0.08);">
            <td style="padding:7px 0;color:#6b7280;">Date</td>
            <td style="padding:7px 0;color:${NEAR_BK};font-weight:700;">${dayLabel}</td>
          </tr>
          <tr style="border-top:1px solid rgba(107,43,217,0.08);">
            <td style="padding:7px 0;color:#6b7280;">Heure</td>
            <td style="padding:7px 0;color:${NEAR_BK};font-weight:700;">${input.time}</td>
          </tr>
          ${input.message ? `
          <tr style="border-top:1px solid rgba(107,43,217,0.08);">
            <td style="padding:7px 0;color:#6b7280;vertical-align:top;">Message</td>
            <td style="padding:7px 0;color:#374151;line-height:1.6;">${input.message.replace(/\n/g, '<br />')}</td>
          </tr>` : ''}
        </table>
      `)}
      <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">
        Répondez directement à cet email pour contacter ${input.firstName}.
      </p>
    `, `Répondez directement à cet email pour contacter ${input.firstName}.`),
  })
}
