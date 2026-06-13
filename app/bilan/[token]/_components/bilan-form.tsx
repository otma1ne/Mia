'use client'

import { useState } from 'react'
import { submitBilan } from '@/app/actions/bilans'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface BilanFormProps {
  token: string
  type: 'CHAUD' | 'FROID'
}

export default function BilanForm({ token, type }: BilanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [answers, setAnswers] = useState<Record<string, any>>(
    type === 'CHAUD'
      ? {
          overallRating: 0,
          contentRating: 0,
          trainerRating: 0,
          confidenceRating: 0,
          wouldRecommend: 0,
          bestLearning: '',
          difficulties: '',
          suggestions: '',
        }
      : {
          examTaken: false,
          examPassed: null,
          applyingRating: 0,
          progressRating: 0,
          wouldRecommend: 0,
          appliedAreas: '',
          persistentDifficulties: '',
          needsSupport: false,
        }
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await submitBilan(token, answers)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/bilan/merci')
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateAnswer = (field: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  if (type === 'CHAUD') {
    return <BilanChaudForm answers={answers} updateAnswer={updateAnswer} onSubmit={handleSubmit} error={error} loading={loading} />
  } else {
    return <BilanFroidForm answers={answers} updateAnswer={updateAnswer} onSubmit={handleSubmit} error={error} loading={loading} />
  }
}

// ─────────────────────────────────────────
// Star Rating Component
// ─────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (val: number) => void
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────
// Bilan Chaud Form
// ─────────────────────────────────────────

function BilanChaudForm({
  answers,
  updateAnswer,
  onSubmit,
  error,
  loading,
}: {
  answers: Record<string, any>
  updateAnswer: (field: string, value: any) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  error: string | null
  loading: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6 space-y-6">
        {/* Rating Fields */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-2">
              1️⃣ Note globale de la formation *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Comment évaluez-vous cette formation globalement ?
            </p>
            <StarRating value={answers.overallRating} onChange={(v) => updateAnswer('overallRating', v)} />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-2">
              2️⃣ Qualité du contenu pédagogique *
            </Label>
            <StarRating value={answers.contentRating} onChange={(v) => updateAnswer('contentRating', v)} />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-2">
              3️⃣ Qualité du / des formateur(s) *
            </Label>
            <StarRating value={answers.trainerRating} onChange={(v) => updateAnswer('trainerRating', v)} />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-2">
              4️⃣ Votre niveau de confiance acquis *
            </Label>
            <StarRating value={answers.confidenceRating} onChange={(v) => updateAnswer('confidenceRating', v)} />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-2">
              5️⃣ Recommanderiez-vous cette formation ? *
            </Label>
            <StarRating value={answers.wouldRecommend} onChange={(v) => updateAnswer('wouldRecommend', v)} />
          </div>
        </div>

        {/* Text Fields */}
        <div className="border-t pt-6 space-y-4">
          <div>
            <Label htmlFor="bestLearning" className="text-base font-semibold">
              6️⃣ Ce que vous avez retenu de plus important *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Qu&apos;est-ce qui vous a le plus marqué ?
            </p>
            <textarea
              id="bestLearning"
              value={answers.bestLearning}
              onChange={(e) => updateAnswer('bestLearning', e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={3}
              required
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="difficulties" className="text-base font-semibold">
              7️⃣ Ce qui vous a semblé difficile *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Quels aspects ont été challengeants pour vous ?
            </p>
            <textarea
              id="difficulties"
              value={answers.difficulties}
              onChange={(e) => updateAnswer('difficulties', e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={3}
              required
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="suggestions" className="text-base font-semibold">
              8️⃣ Suggestions d&apos;amélioration (optionnel)
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Comment pourrions-nous améliorer cette formation ?
            </p>
            <textarea
              id="suggestions"
              value={answers.suggestions}
              onChange={(e) => updateAnswer('suggestions', e.target.value)}
              placeholder="Vos suggestions..."
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Soumission en cours...
          </>
        ) : (
          'Soumettre mon Bilan Chaud'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Les champs marqués avec * sont obligatoires.
      </p>
    </form>
  )
}

// ─────────────────────────────────────────
// Bilan Froid Form
// ─────────────────────────────────────────

function BilanFroidForm({
  answers,
  updateAnswer,
  onSubmit,
  error,
  loading,
}: {
  answers: Record<string, any>
  updateAnswer: (field: string, value: any) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  error: string | null
  loading: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="p-6 space-y-6">
        {/* Exam Status */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">
              1️⃣ Avez-vous passé votre examen depuis la formation ? *
            </Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateAnswer('examTaken', true)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  answers.examTaken === true
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                }`}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => updateAnswer('examTaken', false)}
                className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                  answers.examTaken === false
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                }`}
              >
                Non
              </button>
            </div>
          </div>

          {answers.examTaken === true && (
            <div className="border-t pt-4">
              <Label className="text-base font-semibold mb-3 block">
                2️⃣ L&apos;avez-vous réussi ? *
              </Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => updateAnswer('examPassed', true)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    answers.examPassed === true
                      ? 'border-green-500 bg-green-100 text-green-700'
                      : 'border-border hover:border-green-500'
                  }`}
                >
                  Oui, réussi ✓
                </button>
                <button
                  type="button"
                  onClick={() => updateAnswer('examPassed', false)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    answers.examPassed === false
                      ? 'border-amber-500 bg-amber-100 text-amber-700'
                      : 'border-border hover:border-amber-500'
                  }`}
                >
                  Non réussi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rating Fields */}
        <div className="border-t pt-6 space-y-4">
          <div>
            <Label className="text-base font-semibold mb-2">
              3️⃣ Application des acquis *
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Dans quelle mesure appliquez-vous ce que vous avez appris ?
            </p>
            <StarRating value={answers.applyingRating} onChange={(v) => updateAnswer('applyingRating', v)} />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-2">
              4️⃣ Votre progression depuis la formation *
            </Label>
            <StarRating value={answers.progressRating} onChange={(v) => updateAnswer('progressRating', v)} />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-2">
              5️⃣ Recommanderiez-vous encore cette formation ? *
            </Label>
            <StarRating value={answers.wouldRecommend} onChange={(v) => updateAnswer('wouldRecommend', v)} />
          </div>
        </div>

        {/* Text Fields */}
        <div className="border-t pt-6 space-y-4">
          <div>
            <Label htmlFor="appliedAreas" className="text-base font-semibold">
              6️⃣ Domaines où vous avez progressé *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Décrivez les domaines dans lesquels vous avez amélioré vos compétences.
            </p>
            <textarea
              id="appliedAreas"
              value={answers.appliedAreas}
              onChange={(e) => updateAnswer('appliedAreas', e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={3}
              required
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="persistentDifficulties" className="text-base font-semibold">
              7️⃣ Difficultés persistantes *
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Quelles difficultés rencontrez-vous toujours ?
            </p>
            <textarea
              id="persistentDifficulties"
              value={answers.persistentDifficulties}
              onChange={(e) => updateAnswer('persistentDifficulties', e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={3}
              required
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
            />
          </div>
        </div>

        {/* Support Need */}
        <div className="border-t pt-6">
          <Label className="text-base font-semibold mb-3 block">
            8️⃣ Avez-vous besoin d&apos;une formation complémentaire ? *
          </Label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => updateAnswer('needsSupport', false)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                answers.needsSupport === false
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              }`}
            >
              Non, tout va bien
            </button>
            <button
              type="button"
              onClick={() => updateAnswer('needsSupport', true)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                answers.needsSupport === true
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:border-primary'
              }`}
            >
              Oui, j&apos;ai besoin d&apos;aide
            </button>
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Soumission en cours...
          </>
        ) : (
          'Soumettre mon Bilan Froid'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Les champs marqués avec * sont obligatoires.
      </p>
    </form>
  )
}
