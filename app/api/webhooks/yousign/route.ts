import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { processSignatureComplete } from '@/lib/inscription-service'

// ─────────────────────────────────────────
// HMAC-SHA256 signature verification
// ─────────────────────────────────────────

function verifySignature(rawBody: string, header: string): boolean {
  // In sandbox mode, skip HMAC verification for easier local testing
  if (process.env.YOUSIGN_ENV === 'sandbox') {
    return true
  }

  const secret = process.env.YOUSIGN_WEBHOOK_SECRET
  if (!secret) return false

  // YouSign sends a plain hex HMAC-SHA256 (no prefix) in X-Yousign-Signature
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, 'utf8'),
      Buffer.from(header, 'utf8')
    )
  } catch {
    return false
  }
}

// ─────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rawBody   = await request.text()
    const sigHeader = request.headers.get('x-yousign-signature') ?? ''

    console.log('[yousign webhook] POST received, body length:', rawBody.length)
    console.log('[yousign webhook] YOUSIGN_ENV:', process.env.YOUSIGN_ENV)

    if (!verifySignature(rawBody, sigHeader)) {
      console.warn('[yousign webhook] Invalid signature — rejected')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: { event_name: string; data?: { signature_request?: { id?: string } } }
    try {
      payload = JSON.parse(rawBody)
    } catch {
      console.error('[yousign webhook] JSON parse error, rawBody:', rawBody.slice(0, 200))
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    console.log('[yousign webhook] event_name:', payload.event_name)

    if (payload.event_name !== 'signature_request.done') {
      return NextResponse.json({ received: true })
    }

    const yousignRequestId = payload.data?.signature_request?.id
    console.log('[yousign webhook] yousignRequestId:', yousignRequestId)

    if (!yousignRequestId) {
      return NextResponse.json({ error: 'Missing signature_request.id' }, { status: 400 })
    }

    const inscription = await db.inscription.findFirst({
      where: { yousignRequestId },
      select: { id: true },
    })
    console.log('[yousign webhook] inscription found:', inscription?.id ?? 'none')

    if (!inscription) {
      // Still return 200 — YouSign should not retry for unknown IDs
      return NextResponse.json({ received: true })
    }

    await processSignatureComplete(inscription.id)
    console.log('[yousign webhook] processSignatureComplete done for:', inscription.id)

    return NextResponse.json({ received: true })

  } catch (err) {
    console.error('[yousign webhook] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
