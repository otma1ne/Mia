'use client'

import { useRef, useState, useTransition } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { submitSignature } from '@/app/actions/inscriptions'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
    <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Document links */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Documents à consulter</p>
        <div className="flex flex-col gap-2">
          {documents.map(doc => (
            <a
              key={doc.url}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              {doc.label}
            </a>
          ))}
        </div>
      </div>

      {/* Consent checkbox */}
      <label className="flex items-start gap-3 cursor-pointer rounded-lg border px-4 py-3 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={e => setAccepted(e.target.checked)}
          className="mt-0.5 accent-primary"
        />
        J&apos;ai lu et j&apos;accepte le contrat, le règlement intérieur, les CGV et le programme de formation.
      </label>

      {/* Signature canvas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Votre signature</p>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Eraser className="h-3.5 w-3.5" />
            Effacer
          </button>
        </div>
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20">
          <SignatureCanvas
            ref={sigRef}
            penColor="#1e2128"
            canvasProps={{ className: 'w-full h-40' }}
            onEnd={() => setIsEmpty(sigRef.current?.isEmpty() ?? true)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Dessinez votre signature ci-dessus avec la souris ou le doigt.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !accepted || isEmpty}
        className="w-full"
        size="lg"
      >
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signature en cours…</>
        ) : (
          'Signer mes documents'
        )}
      </Button>
    </div>
  )
}
