'use client'

import { useState, useTransition } from 'react'
import { submitEvaluation } from '@/app/actions/inscriptions'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { EvaluationField, EvaluationData } from '@/lib/evaluation-config'

interface EvaluationFormProps {
  token: string
  fields: EvaluationField[]
}

export default function EvaluationForm({ token, fields }: EvaluationFormProps) {
  const [answers, setAnswers]   = useState<EvaluationData>({})
  const [error, setError]       = useState('')
  const [isPending, startTransition] = useTransition()

  function setField(key: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function toggleCheckbox(key: string, option: string) {
    const current = (answers[key] as string[]) ?? []
    const updated  = current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option]
    setField(key, updated)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate required fields (skip section headings)
    for (const field of fields) {
      if (field.type === 'section' || !field.required) continue
      const val = answers[field.key]
      if (!val || (Array.isArray(val) && val.length === 0)) {
        setError(`Le champ "${field.label}" est obligatoire.`)
        return
      }
    }

    startTransition(async () => {
      const result = await submitEvaluation(token, answers)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {fields.map(field => {
        // Section heading — no input, just a visual divider
        if (field.type === 'section') {
          return (
            <div key={field.key} className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b pb-2">
                {field.label}
              </p>
            </div>
          )
        }

        return (
          <div key={field.key} className="space-y-2">
            <Label className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>

            {field.type === 'text' && (
              <input
                type="text"
                value={(answers[field.key] as string) ?? ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder ?? 'Votre réponse…'}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                rows={4}
                value={(answers[field.key] as string) ?? ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder ?? 'Votre réponse…'}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            )}

            {field.type === 'radio' && field.options && (
              <div className="flex flex-col gap-2">
                {field.options.map(option => (
                  <label
                    key={option}
                    className="flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/5"
                  >
                    <input
                      type="radio"
                      name={field.key}
                      value={option}
                      checked={(answers[field.key] as string) === option}
                      onChange={() => setField(field.key, option)}
                      className="accent-primary"
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && field.options && (
              <div className="flex flex-col gap-2">
                {field.options.map(option => {
                  const checked = ((answers[field.key] as string[]) ?? []).includes(option)
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-muted has-checked:border-primary has-checked:bg-primary/5"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheckbox(field.key, option)}
                        className="accent-primary"
                      />
                      {option}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <Button type="submit" disabled={isPending} className="w-full" size="lg">
        {isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi en cours…</>
        ) : (
          'Soumettre mon évaluation'
        )}
      </Button>
    </form>
  )
}
