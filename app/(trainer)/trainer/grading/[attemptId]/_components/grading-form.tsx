'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { gradeOpenAnswers } from '@/app/actions/exams'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2, XCircle, Loader2, Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from '@prisma/client'

interface Choice {
  id: string
  text: string
  isCorrect: boolean
}

interface Answer {
  id: string
  value: unknown
  pointsAwarded: number | null
  isCorrect: boolean | null
  graderNote: string | null
}

interface Question {
  id: string
  text: string
  type: QuestionType
  points: number
  choices: Choice[]
  correctAnswer: unknown
  answer: Answer | null
}

interface Props {
  attemptId: string
  exam: { title: string; passingScore: number }
  questions: Question[]
}

export default function GradingForm({ attemptId, exam, questions }: Props) {
  const router = useRouter()

  // Open answers: local state for points + notes
  const [grades, setGrades] = useState<Record<string, { points: number; note: string }>>(() => {
    const init: Record<string, { points: number; note: string }> = {}
    for (const q of questions) {
      if (q.type === 'OPEN' && q.answer) {
        init[q.answer.id] = {
          points: q.answer.pointsAwarded ?? 0,
          note: q.answer.graderNote ?? '',
        }
      }
    }
    return init
  })

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  function updateGrade(answerId: string, patch: Partial<{ points: number; note: string }>) {
    setGrades(prev => ({ ...prev, [answerId]: { ...prev[answerId], ...patch } }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload = Object.entries(grades).map(([answerId, g]) => ({
      answerId,
      pointsAwarded: g.points,
      graderNote: g.note || undefined,
    }))

    startTransition(async () => {
      const r = await gradeOpenAnswers(attemptId, payload)
      if (r?.error) {
        setError(r.error)
        return
      }
      if (r?.success) {
        setResult({ score: r.score!, passed: r.passed! })
        // Give the user a moment to see the result, then redirect
        setTimeout(() => router.push('/trainer/grading'), 2000)
      }
    })
  }

  const openQuestions = questions.filter(q => q.type === 'OPEN')
  const autoGradedQuestions = questions.filter(q => q.type !== 'OPEN')

  // Computed preview score from current grades
  const previewEarned = questions.reduce((sum, q) => {
    if (q.type === 'OPEN' && q.answer) {
      return sum + (grades[q.answer.id]?.points ?? 0)
    }
    return sum + (q.answer?.pointsAwarded ?? 0)
  }, 0)
  const previewTotal = questions.reduce((sum, q) => sum + q.points, 0)
  const previewScore = previewTotal > 0 ? Math.round((previewEarned / previewTotal) * 100) : 0
  const previewPassed = previewScore >= exam.passingScore

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auto-graded questions (read-only summary) */}
      {autoGradedQuestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Questions auto-corrigées ({autoGradedQuestions.length})
          </h2>
          {autoGradedQuestions.map((q, idx) => (
            <Card key={q.id}>
              <CardContent className="py-3 flex items-start gap-2">
                {q.answer?.isCorrect
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <span className="text-muted-foreground mr-1.5">#{idx + 1}</span>
                    {q.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.answer?.pointsAwarded ?? 0} / {q.points} pt{q.points !== 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Open questions — grader input */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Questions ouvertes à corriger ({openQuestions.length})
        </h2>

        {openQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Aucune question ouverte à corriger.
            </CardContent>
          </Card>
        ) : (
          openQuestions.map((q) => {
            const answer = q.answer
            if (!answer) return null
            const studentText = (answer.value as { text?: string } | null)?.text ?? ''
            const grade = grades[answer.id] ?? { points: 0, note: '' }

            return (
              <Card key={q.id}>
                <CardContent className="py-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">{q.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Maximum : {q.points} pt{q.points !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="rounded-md border bg-muted/40 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Réponse de l&apos;étudiant :</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {studentText || <span className="italic text-muted-foreground">(Vide)</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`points-${answer.id}`}>Points attribués</Label>
                      <Input
                        id={`points-${answer.id}`}
                        type="number" min={0} max={q.points} step={0.5}
                        value={grade.points}
                        onChange={e => updateGrade(answer.id, { points: Math.max(0, Math.min(q.points, Number(e.target.value) || 0)) })}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`note-${answer.id}`}>Commentaire (optionnel)</Label>
                      <textarea
                        id={`note-${answer.id}`}
                        value={grade.note}
                        onChange={e => updateGrade(answer.id, { note: e.target.value })}
                        rows={2}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Summary + submit */}
      <div className="border-t pt-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm">
          <span className="text-muted-foreground">Score actuel : </span>
          <span className={cn(
            'font-bold tabular-nums',
            previewPassed ? 'text-emerald-600' : 'text-red-600'
          )}>
            {previewScore}%
          </span>
          <span className="text-muted-foreground"> (passage : {exam.passingScore}%)</span>
        </div>

        {error && <p className="text-sm text-destructive w-full">{error}</p>}
        {result && (
          <p className="text-sm text-emerald-600 w-full">
            Correction enregistrée : {result.score}% — {result.passed ? 'Réussi' : 'Non réussi'}
          </p>
        )}

        <Button type="submit" disabled={isPending || !!result}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer la correction
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
