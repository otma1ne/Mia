'use client'

import { useRef, useState, useTransition } from 'react'
import { saveAccessPlans } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Upload, Trash2, FileText, ExternalLink, Loader2 } from 'lucide-react'

interface CenterAccessPlansFormProps {
  centerId: string
  initialPlans: string[]
}

function fileName(url: string) {
  try {
    const parts = new URL(url).pathname.split('/')
    return decodeURIComponent(parts[parts.length - 1])
  } catch {
    return url
  }
}

export default function CenterAccessPlansForm({ centerId, initialPlans }: CenterAccessPlansFormProps) {
  const [plans, setPlans]           = useState<string[]>(initialPlans)
  const [uploading, setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [success, setSuccess]       = useState(false)
  const [saveError, setSaveError]   = useState('')
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError('')
    setSuccess(false)
    setUploading(true)

    const body = new FormData()
    body.append('file', file)

    try {
      const res  = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json()

      if (!res.ok || json.error) {
        setUploadError(json.error ?? 'Erreur lors du téléversement.')
      } else {
        const next = [...plans, json.url as string]
        setPlans(next)
        startTransition(async () => {
          const result = await saveAccessPlans(centerId, next)
          if (result?.success) setSuccess(true)
          else setSaveError('Erreur lors de la sauvegarde.')
        })
      }
    } catch {
      setUploadError('Erreur réseau, veuillez réessayer.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleRemove(url: string) {
    const next = plans.filter(p => p !== url)
    setPlans(next)
    setSuccess(false)
    setSaveError('')
    startTransition(async () => {
      const result = await saveAccessPlans(centerId, next)
      if (result?.success) setSuccess(true)
      else setSaveError('Erreur lors de la sauvegarde.')
    })
  }

  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold">Plans d&apos;accès</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Documents PDF ou images indiquant comment accéder au centre (carte, itinéraire…).
        </p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">Plans d&apos;accès mis à jour.</AlertDescription>
        </Alert>
      )}
      {(uploadError || saveError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError || saveError}</AlertDescription>
        </Alert>
      )}

      {/* Existing plans */}
      {plans.length > 0 && (
        <div className="flex flex-col gap-2">
          {plans.map(url => (
            <div key={url} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 min-w-0 text-sm truncate">{fileName(url)}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Ouvrir"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleRemove(url)}
                disabled={isPending}
                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {plans.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun plan d&apos;accès ajouté.</p>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || isPending}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Téléversement…' : 'Ajouter un document'}
        </Button>
        <p className="text-xs text-muted-foreground mt-1.5">PDF ou image — 20 Mo max.</p>
      </div>
    </div>
  )
}
