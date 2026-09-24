import { db } from '@/lib/db'

/**
 * Envoie une alerte "nouveau lead" sur Slack, Telegram et/ou WhatsApp.
 * Chaque canal n'est utilisé que si ses variables d'environnement sont définies.
 *
 *  Slack     → SLACK_WEBHOOK_URL
 *  Telegram  → TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
 *  WhatsApp  → CALLMEBOT_PHONE + CALLMEBOT_API_KEY   (service gratuit CallMeBot)
 */

export interface LeadNotification {
  name: string
  email: string
  phone: string
  company?: string | null
  formation: string
  message?: string | null
}

function buildText(l: LeadNotification) {
  return [
    '🎯 Nouveau lead MIA Académie',
    '',
    `👤 Nom : ${l.name}`,
    `📧 Email : ${l.email}`,
    `📞 Téléphone : ${l.phone}`,
    `🏢 Entreprise : ${l.company || '—'}`,
    `📚 Besoin : ${l.formation}`,
    '',
    `💬 Message : ${l.message || '—'}`,
  ].join('\n')
}

async function sendSlack(text: string) {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`Slack ${res.status}: ${await res.text()}`)
}

async function sendTelegram(text: string) {
  const token   = process.env.TELEGRAM_BOT_TOKEN
  // Plusieurs destinataires possibles : TELEGRAM_CHAT_ID="111111,222222"
  const envIds = (process.env.TELEGRAM_CHAT_ID ?? '').split(',').map(id => id.trim()).filter(Boolean)
  // + les commerciaux abonnés via le lien d'invitation du bot
  const subscribers = await db.telegramSubscriber.findMany({ select: { chatId: true } }).catch(err => {
    console.error('[leads] Lecture des abonnés Telegram impossible :', err)
    return [] as { chatId: string }[]
  })
  const chatIds = [...new Set([...envIds, ...subscribers.map(s => s.chatId)])]
  if (!token || chatIds.length === 0) return
  const errors: string[] = []
  await Promise.all(chatIds.map(async chatId => {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    if (!res.ok) errors.push(`chat ${chatId} → ${res.status}: ${await res.text()}`)
  }))
  if (errors.length) throw new Error(errors.join(' | '))
}

async function sendWhatsApp(text: string) {
  const phone  = process.env.CALLMEBOT_PHONE
  const apiKey = process.env.CALLMEBOT_API_KEY
  if (!phone || !apiKey) return
  const url =
    `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}` +
    `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(apiKey)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`WhatsApp ${res.status}: ${await res.text()}`)
}

export async function notifyNewLead(lead: LeadNotification) {
  const text = buildText(lead)
  const channels = {
    Slack:    !!process.env.SLACK_WEBHOOK_URL,
    Telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    WhatsApp: !!(process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_API_KEY),
  }
  const active = Object.entries(channels).filter(([, on]) => on).map(([n]) => n)
  if (active.length === 0) {
    console.warn('[leads] Aucun canal configuré (variables vides) — redémarrez `npm run dev` après avoir modifié .env.local')
    return
  }
  const results = await Promise.allSettled([
    sendSlack(text),
    sendTelegram(text),
    sendWhatsApp(text),
  ])
  results.forEach((r, i) => {
    const name = ['Slack', 'Telegram', 'WhatsApp'][i] as keyof typeof channels
    if (r.status === 'fulfilled' && channels[name]) console.log(`[leads] Notification ${name} envoyée ✅`)
    if (r.status === 'rejected') {
      console.error(`[leads] Notification ${['Slack', 'Telegram', 'WhatsApp'][i]} échouée :`, r.reason)
    }
  })
}
