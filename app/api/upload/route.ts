import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { cloudinary } from '@/lib/cloudinary'
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from '@/lib/rate-limit'

// Max file sizes
const MAX_SIZE: Record<string, number> = {
  pdf:   20 * 1024 * 1024,  // 20 MB
  image: 10 * 1024 * 1024,  // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
}

function detectType(mime: string): { materialType: string; resourceType: 'image' | 'video' | 'raw' } | null {
  if (mime === 'application/pdf')   return { materialType: 'pdf',   resourceType: 'image' }
  if (mime.startsWith('image/'))    return { materialType: 'image', resourceType: 'image' }
  if (mime.startsWith('video/'))    return { materialType: 'video', resourceType: 'video' }
  return null
}

export async function POST(request: NextRequest) {
  // ────────────────────────────────────────
  // Rate limiting: max 10 uploads per hour
  // ────────────────────────────────────────
  const clientIp = getClientIp(request.headers)
  const rateLimitKey = `upload:${clientIp}`
  const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG.upload)

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Trop de téléversements. Réessayez après ${rateLimit.resetTime.toLocaleTimeString()}.` },
      { status: 429 }
    )
  }

  // ────────────────────────────────────────
  // Authentication — only ADMIN or TRAINER
  // ────────────────────────────────────────
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  if (!['ADMIN', 'TRAINER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 })
  }

  // ────────────────────────────────────────
  // Validate file presence
  // ────────────────────────────────────────
  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
  }

  const detected = detectType(file.type)
  if (!detected) {
    return NextResponse.json(
      { error: 'Type de fichier non supporté. Utilisez PDF, image ou vidéo.' },
      { status: 400 }
    )
  }

  const { materialType, resourceType } = detected
  const maxSize = MAX_SIZE[materialType]

  if (file.size > maxSize) {
    const mb = maxSize / (1024 * 1024)
    return NextResponse.json(
      { error: `Fichier trop volumineux. Maximum ${mb} Mo pour ce type.` },
      { status: 400 }
    )
  }

  // Convert to buffer and upload to Cloudinary
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: resourceType,
              folder: 'MIA Formation/materials',
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error || !result) reject(error ?? new Error('Upload échoué'))
              else resolve(result as { secure_url: string; public_id: string })
            }
          )
          .end(buffer)
      }
    )

    return NextResponse.json({ url: result.secure_url, type: materialType })
  } catch (err) {
    console.error('[Cloudinary upload error]', err)
    return NextResponse.json(
      { error: 'Erreur lors du téléversement vers Cloudinary.' },
      { status: 500 }
    )
  }
}
