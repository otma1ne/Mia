import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Webhook Telegram : permet à un commercial de s'abonner aux leads.
 *  - /start <CODE>  → abonnement (CODE = TELEGRAM_JOIN_CODE)
 *  - /stop          → désabonnement
 * Lien à partager : https://t.me/<bot>?start=<CODE>
 */

async function reply(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(err => console.error('[telegram] reply error:', err))
}

export async function POST(req: Request) {
  // Vérifie que l'appel vient bien de Telegram
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!secret || req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const update = await req.json().catch(() => null)
  const msg = update?.message
  if (!msg?.chat?.id || typeof msg.text !== 'string') return NextResponse.json({ ok: true })

  const chatId   = String(msg.chat.id)
  const text     = msg.text.trim()
  const name     = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || null
  const username = msg.from?.username ?? null

  if (text.startsWith('/start')) {
    const code = text.split(/\s+/)[1] ?? ''
    const already = await db.telegramSubscriber.findUnique({ where: { chatId } })

    if (already) {
      await reply(chatId, '✅ Vous êtes déjà abonné aux nouveaux leads MIA Académie.\nEnvoyez /stop pour vous désabonner.')
    } else if (code && code === process.env.TELEGRAM_JOIN_CODE) {
      await db.telegramSubscriber.create({ data: { chatId, name, username } })
      await reply(chatId, '✅ C\'est fait ! Vous recevrez ici chaque nouveau lead MIA Académie.\nEnvoyez /stop pour vous désabonner.')
      console.log(`[telegram] Nouvel abonné : ${name ?? ''} @${username ?? ''} (${chatId})`)
    } else {
      await reply(chatId, '🔒 Accès réservé à l\'équipe MIA Académie.\nDemandez le lien d\'invitation à votre responsable.')
    }
  } else if (text === '/stop') {
    await db.telegramSubscriber.deleteMany({ where: { chatId } })
    await reply(chatId, '👋 Vous ne recevrez plus les leads. Rouvrez le lien d\'invitation pour vous réabonner.')
  }

  return NextResponse.json({ ok: true })
}
