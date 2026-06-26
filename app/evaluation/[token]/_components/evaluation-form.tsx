'use client'

import { useState, useTransition } from 'react'
import { submitEvaluation } from '@/app/actions/inscriptions'
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react'
import type { EvaluationField, EvaluationData } from '@/lib/evaluation-config'

interface EvaluationFormProps {
  token: string
  fields: EvaluationField[]
}

export default function EvaluationForm({ token, fields }: EvaluationFormProps) {
  const [answers, setAnswers]        = useState<EvaluationData>({})
  const [error, setError]            = useState('')
  const [isPending, startTransition] = useTransition()

  function setField(key: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function toggleCheckbox(key: string, option: string) {
    const current = (answers[key] as string[]) ?? []
    setField(key, current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option],
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
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
    <form onSubmit={handleSubmit} className="ev-form">

      {error && (
        <div className="ev-error">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {fields.map(field => {
        if (field.type === 'section') {
          return (
            <div key={field.key} className="ev-section">
              <span className="ev-section-label">{field.label}</span>
            </div>
          )
        }

        return (
          <div key={field.key} className="ev-field">
            <label className="ev-label">
              {field.label}
              {field.required && <span className="ev-required">*</span>}
            </label>

            {field.type === 'text' && (
              <input
                type="text"
                className="ev-input"
                value={(answers[field.key] as string) ?? ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder ?? 'Votre réponse…'}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                rows={3}
                className="ev-textarea"
                value={(answers[field.key] as string) ?? ''}
                onChange={e => setField(field.key, e.target.value)}
                placeholder={field.placeholder ?? 'Votre réponse…'}
              />
            )}

            {field.type === 'radio' && field.options && (
              <div className="ev-options">
                {field.options.map(option => {
                  const checked = (answers[field.key] as string) === option
                  return (
                    <label
                      key={option}
                      className={`ev-option${checked ? ' ev-option-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name={field.key}
                        value={option}
                        checked={checked}
                        onChange={() => setField(field.key, option)}
                      />
                      {option}
                    </label>
                  )
                })}
              </div>
            )}

            {field.type === 'checkbox' && field.options && (
              <div className="ev-options">
                {field.options.map(option => {
                  const checked = ((answers[field.key] as string[]) ?? []).includes(option)
                  return (
                    <label
                      key={option}
                      className={`ev-option${checked ? ' ev-option-active' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheckbox(field.key, option)}
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

      <button type="submit" disabled={isPending} className="ev-submit">
        {isPending
          ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
          : <><span>Soumettre mon évaluation</span><ArrowRight size={16} /></>
        }
      </button>
    </form>
  )
}
