'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitFormationEvaluation, type EvaluationAnswers } from '@/app/actions/evaluation'
import { Button } from '@/components/ui/button'
import { Loader2, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────
// Star rating widget
// ─────────────────────────────────────────

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                'h-7 w-7 transition-colors',
                (hovered > 0 ? n <= hovered : n <= value)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground/30'
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? ratingLabel(value) : 'Non évalué'}
        </span>
      </div>
    </div>
  )
}

function ratingLabel(v: number) {
  const labels: Record<number, string> = {
    1: 'Très insatisfait',
    2: 'Insatisfait',
    3: 'Correct',
    4: 'Satisfait',
    5: 'Très satisfait',
  }
  return labels[v] ?? ''
}

// ─────────────────────────────────────────
// Main form
// ─────────────────────────────────────────

export default function EvaluationForm({ formationId }: { formationId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [answers, setAnswers] = useState<EvaluationAnswers>({
    overallRating: 0,
    contentRating: 0,
    trainerRating: 0,
    wouldRecommend: true,
    bestLearning: '',
    suggestions: '',
  })

  const isValid =
    answers.overallRating > 0 &&
    answers.contentRating > 0 &&
    answers.trainerRating > 0

  function handleSubmit() {
    if (!isValid) return
    setError(null)
    startTransition(async () => {
      const result = await submitFormationEvaluation(formationId, answers)
      if (result?.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Ratings */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-5">
        <p className="text-sm font-semibold">Évaluations (obligatoires)</p>
        <StarRating
          label="Satisfaction globale"
          value={answers.overallRating}
          onChange={v => setAnswers(prev => ({ ...prev, overallRating: v }))}
        />
        <StarRating
          label="Qualité du contenu pédagogique"
          value={answers.contentRating}
          onChange={v => setAnswers(prev => ({ ...prev, contentRating: v }))}
        />
        <StarRating
          label="Qualité de l'encadrement (formateur)"
          value={answers.trainerRating}
          onChange={v => setAnswers(prev => ({ ...prev, trainerRating: v }))}
        />
      </div>

      {/* Recommendation */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-3">
        <p className="text-sm font-semibold">Recommanderiez-vous cette formation ?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAnswers(prev => ({ ...prev, wouldRecommend: true }))}
            className={cn(
              'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors',
              answers.wouldRecommend
                ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                : 'border-border hover:bg-muted text-muted-foreground'
            )}
          >
            Oui, je la recommande
          </button>
          <button
            type="button"
            onClick={() => setAnswers(prev => ({ ...prev, wouldRecommend: false }))}
            className={cn(
              'flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors',
              !answers.wouldRecommend
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-border hover:bg-muted text-muted-foreground'
            )}
          >
            Non
          </button>
        </div>
      </div>

      {/* Open questions */}
      <div className="rounded-lg border bg-card p-5 flex flex-col gap-4">
        <p className="text-sm font-semibold">Questions ouvertes (facultatives)</p>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Ce que vous avez le mieux appris / retenu
          </label>
          <textarea
            value={answers.bestLearning}
            onChange={e => setAnswers(prev => ({ ...prev, bestLearning: e.target.value }))}
            placeholder="Décrivez les apprentissages les plus marquants…"
            className="min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Suggestions d'amélioration
          </label>
          <textarea
            value={answers.suggestions}
            onChange={e => setAnswers(prev => ({ ...prev, suggestions: e.target.value }))}
            placeholder="Comment pourrions-nous améliorer cette formation ?…"
            className="min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!isValid && (
        <p className="text-xs text-muted-foreground">
          Veuillez renseigner les 3 notes (globale, contenu, formateur) pour soumettre.
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!isValid || isPending}
        size="lg"
        className="w-full sm:w-auto"
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours…</>
        ) : (
          'Soumettre mon évaluation'
        )}
      </Button>
    </div>
  )
}
