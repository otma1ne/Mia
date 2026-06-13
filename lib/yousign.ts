// YouSign API v3 — thin fetch-based client (no SDK)
// Docs: https://developers.yousign.com/reference/
// Set YOUSIGN_ENV=sandbox in .env.local to use the sandbox environment

const YOUSIGN_BASE = process.env.YOUSIGN_ENV === 'sandbox'
  ? 'https://api-sandbox.yousign.app/v3'
  : 'https://api.yousign.app/v3'

// ─────────────────────────────────────────
// Error type
// ─────────────────────────────────────────

export class YouSignError extends Error {
  constructor(
    message: string,
    public readonly step: 'create' | 'document' | 'signer' | 'activate',
    public readonly status?: number
  ) {
    super(message)
    this.name = 'YouSignError'
  }
}

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SignerInfo {
  firstName: string
  lastName: string
  email: string
  locale?: string
}

export interface CreateSignatureRequestResult {
  requestId: string
  documentIds: {
    contrat:   string
    reglement: string
    cgv:       string
  }
}

interface DocumentUrls {
  contrat: string
  reglement: string
  cgv: string
  programme: string
}

// ─────────────────────────────────────────
// Internal HTTP helper
// ─────────────────────────────────────────

async function yousignFetch(
  path: string,
  options: RequestInit,
  step: YouSignError['step']
): Promise<unknown> {
  const apiKey = process.env.YOUSIGN_API_KEY
  if (!apiKey) throw new Error('[YouSign] Missing required env var: YOUSIGN_API_KEY')

  const res = await fetch(`${YOUSIGN_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new YouSignError(
      `YouSign ${step} failed (${res.status}): ${body}`,
      step,
      res.status
    )
  }

  return res.json()
}

// ─────────────────────────────────────────
// Document metadata (name + Cloudinary URL)
// ─────────────────────────────────────────

function buildDocuments(urls: DocumentUrls) {
  return [
    { name: 'Contrat de formation', url: urls.contrat   },
    { name: 'Règlement intérieur',  url: urls.reglement  },
    { name: 'CGV',                  url: urls.cgv        },
  ]
}

// ─────────────────────────────────────────
// Main function
// ─────────────────────────────────────────

export async function createSignatureRequest(
  signer: SignerInfo,
  formationTitle: string,
  documentUrls: DocumentUrls
): Promise<CreateSignatureRequestResult> {
  const documents = buildDocuments(documentUrls)

  // ── 1. Create signature request ───────────────────────────────────────────
  const request = await yousignFetch(
    '/signature_requests',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Dossier inscription — ${formationTitle} — ${signer.lastName} ${signer.firstName}`,
        delivery_mode: 'email',
        timezone: 'Africa/Casablanca',
      }),
    },
    'create'
  ) as { id: string }

  const signatureRequestId = request.id

  // ── 2. Upload the 4 documents ─────────────────────────────────────────────
  const documentIds: string[] = []

  for (const doc of documents) {
    // Fetch PDF bytes from Cloudinary
    const pdfRes = await fetch(doc.url)
    if (!pdfRes.ok) {
      throw new YouSignError(
        `Failed to fetch document "${doc.name}" from Cloudinary (${pdfRes.status})`,
        'document'
      )
    }
    const pdfBytes = await pdfRes.arrayBuffer()

    // Upload to YouSign as multipart/form-data
    const formData = new FormData()
    formData.append(
      'file',
      new Blob([pdfBytes], { type: 'application/pdf' }),
      `${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
    )
    formData.append('nature', 'signable_document')

    const uploaded = await yousignFetch(
      `/signature_requests/${signatureRequestId}/documents`,
      { method: 'POST', body: formData },
      'document'
    ) as { id: string }

    documentIds.push(uploaded.id)
  }

  // ── 3. Add signer with one signature field per document ───────────────────
  const signatureFields = documentIds.map((documentId) => ({
    type: 'signature',
    document_id: documentId,
    page: 1,
    x: 77,
    y: 700,
    width: 200,
    height: 50,
  }))

  await yousignFetch(
    `/signature_requests/${signatureRequestId}/signers`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        info: {
          first_name: signer.firstName,
          last_name: signer.lastName,
          email: signer.email,
          locale: signer.locale ?? 'fr',
        },
        signature_level: 'electronic_signature',
        signature_authentication_mode: 'no_otp',
        fields: signatureFields,
      }),
    },
    'signer'
  )

  // ── 4. Activate — YouSign sends signing email to student ──────────────────
  await yousignFetch(
    `/signature_requests/${signatureRequestId}/activate`,
    { method: 'POST' },
    'activate'
  )

  return {
    requestId: signatureRequestId,
    documentIds: {
      contrat:   documentIds[0],
      reglement: documentIds[1],
      cgv:       documentIds[2],
    },
  }
}

// ─────────────────────────────────────────
// Download a single signed document from YouSign
// ─────────────────────────────────────────

export async function downloadSignedDocument(
  signatureRequestId: string,
  documentId: string
): Promise<Buffer> {
  const apiKey = process.env.YOUSIGN_API_KEY
  if (!apiKey) throw new Error('[YouSign] Missing required env var: YOUSIGN_API_KEY')

  const res = await fetch(
    `${YOUSIGN_BASE}/signature_requests/${signatureRequestId}/documents/${documentId}/download?version=completed`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new YouSignError(
      `YouSign document download failed (${res.status}): ${body}`,
      'document',
      res.status
    )
  }

  return Buffer.from(await res.arrayBuffer())
}
