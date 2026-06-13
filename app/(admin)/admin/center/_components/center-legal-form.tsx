'use client'

import { useState, useTransition } from 'react'
import { saveCenterLegal } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface CenterLegalFormProps {
  centerId: string
  initialReglement: string | null
  initialCgv: string | null
}

export default function CenterLegalForm({ centerId, initialReglement, initialCgv }: CenterLegalFormProps) {
  const [reglement, setReglement] = useState(initialReglement ?? '')
  const [cgv, setCgv]             = useState(initialCgv ?? '')
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSuccess(false)
    setError('')
    startTransition(async () => {
      const result = await saveCenterLegal(centerId, { reglement, cgv })
      if (result?.success) setSuccess(true)
      else setError('Une erreur est survenue. Veuillez réessayer.')
    })
  }

  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-semibold">Documents légaux</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Ces contenus sont utilisés pour générer automatiquement les documents envoyés aux étudiants pour signature.
        </p>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">Documents légaux enregistrés.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Règlement intérieur */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="reglement">
          Règlement intérieur
        </label>
        <textarea
          id="reglement"
          rows={10}
          value={reglement}
          onChange={e => setReglement(e.target.value)}
          placeholder="Rédigez le règlement intérieur…"
          className="h-auto w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {/* CGV */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="cgv">
          Conditions Générales de Vente (CGV)
        </label>
        <textarea
          id="cgv"
          rows={10}
          value={cgv}
          onChange={e => setCgv(e.target.value)}
          placeholder="Rédigez les conditions générales de vente…"
          className="h-auto w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? 'Enregistrement…' : 'Enregistrer les documents légaux'}
        </Button>
      </div>
    </div>
  )
}
