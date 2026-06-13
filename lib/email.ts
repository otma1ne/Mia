import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const FROM    = process.env.SMTP_FROM ?? 'EduDrive <noreply@edudrive.ma>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Shared header/footer snippets
const emailHeader = `
  <div style="background:#1e2128;padding:24px 32px;border-radius:8px 8px 0 0;">
    <h1 style="color:#fff;font-size:20px;margin:0;">🎓 EduDrive</h1>
  </div>
`
const emailFooter = `
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
  <p style="font-size:12px;color:#9ca3af;margin:0;">
    EduDrive — Académie de formation professionnelle<br />
    ${APP_URL}
  </p>
`

export async function sendEvaluationEmail(
  to: string,
  firstName: string,
  token: string
) {
  const link = `${APP_URL}/evaluation/${token}`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Complétez votre évaluation de besoins — EduDrive',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Merci pour votre demande d'inscription. Afin de mieux vous accompagner,
            nous avons besoin de quelques informations complémentaires.
          </p>
          <p style="color:#374151;">
            Veuillez compléter votre <strong>évaluation de besoins</strong> en cliquant sur le bouton ci-dessous.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Compléter l'évaluation
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            ⚠️ Ce lien est valable pendant <strong>24 heures</strong>. Passé ce délai, vous devrez soumettre
            une nouvelle demande d'inscription.
          </p>
          ${emailFooter}
        </div>
      </div>
    `,
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
    from: FROM,
    to,
    subject: '🎉 Votre candidature a été acceptée — EduDrive',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Nous avons le plaisir de vous informer que votre candidature pour la formation
            <strong>${formationTitle}</strong> a été <strong style="color:#16a34a;">acceptée</strong>. 🎉
          </p>
          <p style="color:#374151;">
            Votre compte a été créé. Voici vos identifiants de connexion :
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Identifiant (email)</p>
            <p style="margin:0 0 16px;font-size:15px;font-weight:600;">${to}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Mot de passe temporaire</p>
            <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:2px;font-family:monospace;">
              ${generatedPassword}
            </p>
          </div>

          <p style="font-size:13px;color:#6b7280;">
            ⚠️ Pour votre sécurité, nous vous recommandons de <strong>changer ce mot de passe</strong>
            dès votre première connexion.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}"
               style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Accéder à mon espace
            </a>
          </div>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}

export async function sendEnrollmentConfirmationEmail(
  to: string,
  firstName: string,
  formationTitle: string
) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Votre inscription à ${formationTitle} est confirmée — EduDrive`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Félicitations ! Votre inscription à la formation
            <strong>${formationTitle}</strong> est maintenant <strong style="color:#16a34a;">confirmée</strong>. 🎉
          </p>
          <p style="color:#374151;">
            Vous pouvez dès à présent accéder à votre espace étudiant pour suivre vos cours.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}"
               style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Accéder à mon espace
            </a>
          </div>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}

export async function sendTrainerWelcomeEmail(
  to: string,
  name: string,
  password: string
) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Bienvenue sur EduDrive — vos identifiants de connexion',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${name}</strong>,</p>
          <p style="color:#374151;">
            Votre compte formateur a été créé sur <strong>EduDrive</strong>.
            Voici vos identifiants de connexion :
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Identifiant (email)</p>
            <p style="margin:0 0 16px;font-size:15px;font-weight:600;">${to}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Mot de passe temporaire</p>
            <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:2px;font-family:monospace;">
              ${password}
            </p>
          </div>

          <p style="font-size:13px;color:#6b7280;">
            ⚠️ Pour votre sécurité, nous vous recommandons de <strong>changer ce mot de passe</strong>
            dès votre première connexion.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}"
               style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Accéder à mon espace
            </a>
          </div>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}

export async function sendDeclineEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  adminNote?: string
) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Suite à votre candidature — EduDrive',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Nous avons bien étudié votre candidature pour la formation
            <strong>${formationTitle}</strong>.
          </p>
          <p style="color:#374151;">
            Après examen de votre dossier, nous ne sommes malheureusement pas en mesure
            de donner suite à votre demande pour le moment.
          </p>
          ${adminNote ? `
          <div style="background:#fef9f0;border-left:4px solid #f59e0b;border-radius:4px;padding:16px 20px;margin:24px 0;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#92400e;">Message de notre équipe :</p>
            <p style="margin:0;font-size:14px;color:#374151;">${adminNote}</p>
          </div>
          ` : ''}
          <p style="color:#374151;">
            Nous vous encourageons à consulter nos autres formations disponibles
            et à soumettre une nouvelle candidature à tout moment.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${APP_URL}/register"
               style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Voir les autres formations
            </a>
          </div>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}

// ─────────────────────────────────────────
// Formation Bilan emails (Chaud & Froid)
// ─────────────────────────────────────────

export async function sendBilanChaudEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  token: string
) {
  const link = `${APP_URL}/bilan/${token}`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: '📋 Votre avis sur la formation — EduDrive',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Félicitations ! Vous avez terminé votre formation <strong>${formationTitle}</strong>.
          </p>
          <p style="color:#374151;">
            Nous aimerions connaître votre retour sur cette expérience.
            Veuillez compléter le formulaire ci-dessous (environ 5 minutes).
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Compléter mon Bilan Chaud
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            ⏰ Ce lien est valable pendant <strong>30 jours</strong>. Passé ce délai, vous ne pourrez plus répondre.
          </p>
          ${emailFooter}
        </div>
      </div>
    `,
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
    from: FROM,
    to,
    subject: '📋 Suivi de votre formation — EduDrive',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Cela fait 3 mois que vous avez terminé votre formation <strong>${formationTitle}</strong>.
          </p>
          <p style="color:#374151;">
            Nous aimerions savoir comment vous appliquez vos apprentissages dans la pratique.
            Veuillez compléter ce formulaire de suivi (environ 5 minutes).
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Compléter mon Bilan Froid
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            ⏰ Ce lien est valable pendant <strong>30 jours</strong>.
          </p>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}

export async function sendBilanReminderEmail(
  to: string,
  firstName: string,
  formationTitle: string,
  token: string,
  type: 'CHAUD' | 'FROID'
) {
  const link = `${APP_URL}/bilan/${token}`
  const title = type === 'CHAUD' ? 'Bilan Chaud' : 'Bilan Froid'
  const message = type === 'CHAUD'
    ? 'Veuillez compléter votre évaluation de la formation.'
    : 'Veuillez compléter votre suivi de formation.'

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `⏰ Rappel : ${title} — ${formationTitle}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${firstName}</strong>,</p>
          <p style="color:#374151;">
            Nous avons remarqué que vous n'avez pas encore complété votre <strong>${title}</strong>
            pour la formation <strong>${formationTitle}</strong>.
          </p>
          <p style="color:#374151;">
            ${message}
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${link}"
               style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Compléter maintenant
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">
            ⏰ Ce lien expire dans les prochains jours.
          </p>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}

// ─────────────────────────────────────────
// Vehicle alert email (sent by daily cron)
// ─────────────────────────────────────────

interface VehicleAlert {
  name: string
  plate: string
  inspectionDate: Date | null
  insuranceExpiry: Date | null
  isExpiredInspection: boolean
  isExpiredInsurance: boolean
}

export async function sendVehicleAlertEmail(to: string, vehicles: VehicleAlert[]) {
  const now = new Date()

  function daysUntil(date: Date | null): string {
    if (!date) return '—'
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `Dépassée de ${Math.abs(diff)} j`
    if (diff === 0) return "Aujourd'hui"
    return `Dans ${diff} j`
  }

  function formatDate(date: Date | null): string {
    if (!date) return '—'
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
  }

  const rows = vehicles.map(v => {
    const lines: string[] = []

    if (v.inspectionDate) {
      const expired = v.isExpiredInspection
      lines.push(`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${v.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${v.plate}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">Visite technique</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${formatDate(v.inspectionDate)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:${expired ? '#dc2626' : '#d97706'};">
            ${daysUntil(v.inspectionDate)}
          </td>
        </tr>
      `)
    }

    if (v.insuranceExpiry) {
      const expired = v.isExpiredInsurance
      lines.push(`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${v.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${v.plate}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">Assurance</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;">${formatDate(v.insuranceExpiry)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;color:${expired ? '#dc2626' : '#d97706'};">
            ${daysUntil(v.insuranceExpiry)}
          </td>
        </tr>
      `)
    }

    return lines.join('')
  }).join('')

  await transporter.sendMail({
    from: FROM,
    to,
    subject: '⚠️ Véhicules — Échéances à venir',
    html: `
      <div style="font-family:sans-serif;background:#f9fafb;padding:32px;">
        <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
          ${emailHeader}
          <div style="padding:32px;">
            <h2 style="font-size:18px;margin:0 0 8px;">⚠️ Véhicules — Échéances à venir</h2>
            <p style="color:#6b7280;margin:0 0 24px;">
              ${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} nécessite${vehicles.length > 1 ? 'nt' : ''} votre attention.
            </p>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;">Véhicule</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;">Plaque</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;">Type</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;">Date</th>
                  <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#6b7280;letter-spacing:.05em;">Délai</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div style="margin-top:24px;">
              <a href="${APP_URL}/admin/vehicles"
                 style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                        padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
                Gérer les véhicules
              </a>
            </div>

            ${emailFooter}
          </div>
        </div>
      </div>
    `,
  })
}

export async function sendCommercialWelcomeEmail(
  to: string,
  name: string,
  password: string
) {
  const loginUrl = `${APP_URL}/login`

  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Bienvenue sur EduDrive — votre espace commercial',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e2128;">
        ${emailHeader}
        <div style="padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:16px;margin-top:0;">Bonjour <strong>${name}</strong>,</p>
          <p style="color:#374151;">
            Votre compte commercial a été créé sur <strong>EduDrive</strong>.
            Voici vos identifiants de connexion :
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Identifiant (email)</p>
            <p style="margin:0 0 16px;font-size:15px;font-weight:600;">${to}</p>
            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">Mot de passe temporaire</p>
            <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:2px;font-family:monospace;">
              ${password}
            </p>
          </div>

          <p style="font-size:13px;color:#6b7280;">
            ⚠️ Pour votre sécurité, nous vous recommandons de <strong>changer ce mot de passe</strong>
            dès votre première connexion.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${loginUrl}"
               style="display:inline-block;background:#1e2128;color:#fff;text-decoration:none;
                      padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">
              Accéder à mon espace
            </a>
          </div>
          ${emailFooter}
        </div>
      </div>
    `,
  })
}
