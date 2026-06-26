import { NextRequest, NextResponse } from 'next/server'
import { cloudinary } from '@/lib/cloudinary'
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from '@/lib/rate-limit'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPE = 'application/pdf'

export async function POST(request: NextRequest) {
  // ────────────────────────────────────────
  // Rate limiting: max 10 uploads per hour
  // ────────────────────────────────────────
  const clientIp = getClientIp(request.headers)
  const rateLimitKey = `upload-cv:${clientIp}`
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG.upload)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Trop de téléversements. Réessayez après ${rateLimit.resetTime.toLocaleTimeString()}.` },
      { status: 429 }
    )
  }

  try {
    // ────────────────────────────────────────
    // Validate file presence and type
    // ────────────────────────────────────────
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
    }

    if (file.type !== ALLOWED_MIME_TYPE) {
      return NextResponse.json({ error: 'Seuls les fichiers PDF sont acceptés.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Le fichier ne doit pas dépasser 5 Mo.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'MIA Digital/cvs',
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve(result.secure_url)
        }
      )
      stream.end(buffer)
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload-cv]', err)
    return NextResponse.json({ error: 'Erreur lors du téléchargement.' }, { status: 500 })
  }
}
