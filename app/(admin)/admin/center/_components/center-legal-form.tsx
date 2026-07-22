'use client'

import { useState, useTransition } from 'react'
import { saveCenterLegal } from '@/app/actions/center'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle } from 'lucide-react'
import RichTextEditor from '@/components/ui/rich-text-editor'

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
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="reglement">
          Règlement intérieur
        </label>
        <RichTextEditor
          value={reglement}
          onChange={setReglement}
          placeholder="Rédigez le règlement intérieur…"
          minHeight={240}
        />
      </div>

      {/* CGV */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium" htmlFor="cgv">
          Conditions Générales de Vente (CGV)
        </label>
        <RichTextEditor
          value={cgv}
          onChange={setCgv}
          placeholder="Rédigez les conditions générales de vente…"
          minHeight={240}
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
