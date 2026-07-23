'use client'

import { useRef, useState, useTransition } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { submitCompanySignature } from '@/app/actions/companies'
import { AlertCircle, ExternalLink, Eraser, Loader2, CheckCircle } from 'lucide-react'

interface CompanySignatureFormProps {
  token: string
  documents: { label: string; url: string }[]
}

export default function CompanySignatureForm({ token, documents }: CompanySignatureFormProps) {
  const sigRef = useRef<SignatureCanvas>(null)
  const [accepted, setAccepted]      = useState(false)
  const [isEmpty, setIsEmpty]        = useState(true)
  const [error, setError]            = useState('')
  const [done, setDone]              = useState(false)
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
      const result = await submitCompanySignature(token, dataUrl)
      if (result?.error) {
        setError(result.error)
      } else {
        setDone(true)
      }
    })
  }

  if (done) {
    return (
      <div className="ev-form" style={{ textAlign: 'center', padding: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <CheckCircle size={48} color="#16a34a" />
        </div>
        <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
          Convention signée avec succès
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Les salariés disposant d&apos;un compte ont été automatiquement inscrits à la session.
          Vous recevrez un email de confirmation.
        </p>
      </div>
    )
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
        {documents.map(doc =>
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
          ) : null,
        )}
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
        J&apos;ai lu et j&apos;accepte la convention de formation, le règlement intérieur et les
        conditions générales de vente. En signant, j&apos;engage l&apos;entreprise pour l&apos;ensemble
        des salariés inscrits à cette session.
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
          'Signer la convention'
        )}
      </button>
    </div>
  )
}
