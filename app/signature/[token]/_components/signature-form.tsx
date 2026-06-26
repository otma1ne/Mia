'use client'

import { useRef, useState, useTransition } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { submitSignature } from '@/app/actions/inscriptions'
import { AlertCircle, ExternalLink, Eraser, Loader2 } from 'lucide-react'

interface SignatureFormProps {
  token: string
  documents: { label: string; url: string }[]
}

export default function SignatureForm({ token, documents }: SignatureFormProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [accepted, setAccepted]      = useState(false)
  const [isEmpty, setIsEmpty]        = useState(true)
  const [error, setError]            = useState('')
  const [isPending, startTransition] = useTransition()

  function handleClear() {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  function handleSubmit() {
    setError('')

    if (!accepted) {
      setError('Veuillez cocher la case de consentement.')
      return
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError('Veuillez dessiner votre signature.')
      return
    }

    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL('image/png')

    startTransition(async () => {
      const result = await submitSignature(token, dataUrl)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="ev-form">
      {error && (
        <div className="ev-error">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Documents */}
      <div className="ev-section">
        <span className="ev-section-label">Documents à consulter</span>
      </div>
      <div className="sg-docs">
        {documents.map(doc => (
          doc.url ? (
            <a
              key={doc.label}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sg-doc-link"
            >
              <ExternalLink size={15} />
              {doc.label}
            </a>
          ) : null
        ))}
      </div>

      {/* Consent */}
      <div className="ev-section">
        <span className="ev-section-label">Consentement</span>
      </div>
      <label className={`ev-option sg-consent${accepted ? ' ev-option-active' : ''}`}>
        <input
          type="checkbox"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
        />
        J&apos;ai lu et j&apos;accepte le contrat de formation, le règlement intérieur,
        les conditions générales de vente et le programme de formation.
      </label>

      {/* Signature canvas */}
      <div className="ev-section">
        <span className="ev-section-label">Votre signature</span>
      </div>
      <div>
        <div className="sg-canvas-header">
          <span className="ev-label">Dessinez ci-dessous</span>
          <button type="button" onClick={handleClear} className="sg-clear-btn">
            <Eraser size={13} />
            Effacer
          </button>
        </div>
        <div className="sg-canvas-wrap">
          <SignatureCanvas
            ref={sigRef}
            penColor="#17171c"
            canvasProps={{ className: 'w-full h-40' }}
            onEnd={() => setIsEmpty(sigRef.current?.isEmpty() ?? true)}
          />
        </div>
        <p className="sg-canvas-hint">
          Utilisez la souris ou le doigt pour dessiner votre signature.
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !accepted || isEmpty}
        className="ev-submit"
      >
        {isPending ? (
          <>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Signature en cours…
          </>
        ) : (
          'Signer mes documents'
        )}
      </button>
    </div>
  )
}
