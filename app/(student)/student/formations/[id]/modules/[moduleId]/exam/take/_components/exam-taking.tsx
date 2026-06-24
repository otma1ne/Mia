'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitExamAttempt } from '@/app/actions/exams'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Clock, Loader2, Send, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuestionType } from '@prisma/client'

interface Choice { id: string; text: string }
interface Question {
  id: string
  text: string
  type: QuestionType
  points: number
  choices: Choice[]
}

interface Props {
  attemptId: string
  examTitle: string
  moduleTitle: string
  formationId: string
  moduleId: string
  timeLimit: number | null // minutes
  startedAt: string        // ISO string
  shuffle: boolean
  questions: Question[]
}

export default function ExamTaking({
  attemptId, examTitle, moduleTitle, formationId, moduleId,
  timeLimit, startedAt, shuffle, questions: rawQuestions,
}: Props) {
  const router = useRouter()
  // Shuffle once on mount (client-side — safe)
  const [questions] = useState<Question[]>(() =>
    shuffle ? [...rawQuestions].sort(() => Math.random() - 0.5) : rawQuestions
  )
  // Map<questionId, string | boolean> — choiceId / 'true'|'false' / text
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // ── Timer ──────────────────────────────────────────────────────────

  const deadline = useMemo(() => {
    if (!timeLimit) return null
    const start = new Date(startedAt).getTime()
    return start + timeLimit * 60 * 1000
  }, [timeLimit, startedAt])

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!deadline) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [deadline])

  const remainingMs = deadline ? Math.max(0, deadline - now) : null
  const expired = remainingMs !== null && remainingMs === 0

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (expired && !isPending) {
      doSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired])

  function formatRemaining(ms: number) {
    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // ── Answer handlers ────────────────────────────────────────────────

  function setAnswer(questionId: string, value: string | boolean) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  // ── Submit ─────────────────────────────────────────────────────────

  function doSubmit() {
    setError(null)
    setConfirmOpen(false)
    startTransition(async () => {
      const payload = questions.map(q => ({
        questionId: q.id,
        value: answers[q.id] ?? '',
      }))
      const result = await submitExamAttempt(attemptId, payload)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.push(`/student/formations/${formationId}/modules/${moduleId}/exam/result`)
    })
  }

  // ── Progress ───────────────────────────────────────────────────────

  const answeredCount = questions.filter(q => {
    const a = answers[q.id]
    if (q.type === 'OPEN') return typeof a === 'string' && a.trim().length > 0
    return a !== undefined && a !== '' && a !== null
  }).length

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6 max-w-3xl mx-auto w-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 -mx-4 lg:-mx-6 px-4 lg:px-6 bg-background/95 backdrop-blur border-b py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate">{examTitle}</h1>
          <p className="text-xs text-muted-foreground truncate">{moduleTitle}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">
            {answeredCount} / {questions.length}
          </span>
          {remainingMs !== null && (
            <span className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium tabular-nums',
              remainingMs < 60_000 ? 'bg-red-100 text-red-700' : 'bg-muted'
            )}>
              <Clock className="h-3.5 w-3.5" />
              {formatRemaining(remainingMs)}
            </span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((q, idx) => (
          <Card key={q.id}>
            <CardContent className="py-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-relaxed">
                  <span className="text-muted-foreground mr-1.5">#{idx + 1}</span>
                  {q.text}
                </p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {q.points} pt{q.points !== 1 ? 's' : ''}
                </span>
              </div>

              {/* QCM */}
              {q.type === 'QCM' && (
                <div className="space-y-1.5">
                  {q.choices.map(c => (
                    <label
                      key={c.id}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors',
                        answers[q.id] === c.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id] === c.id}
                        onChange={() => setAnswer(q.id, c.id)}
                        className="h-4 w-4"
                      />
                      <span>{c.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {q.type === 'TRUE_FALSE' && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={answers[q.id] === 'true' ? 'default' : 'outline'}
                    onClick={() => setAnswer(q.id, 'true')}
                    size="sm"
                  >
                    Vrai
                  </Button>
                  <Button
                    type="button"
                    variant={answers[q.id] === 'false' ? 'default' : 'outline'}
                    onClick={() => setAnswer(q.id, 'false')}
                    size="sm"
                  >
                    Faux
                  </Button>
                </div>
              )}

              {/* Open */}
              {q.type === 'OPEN' && (
                <textarea
                  value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  rows={4}
                  placeholder="Votre réponse…"
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit bar */}
      <div className="border-t pt-4 flex items-center justify-between gap-3 flex-wrap">
        {error && <p className="text-sm text-destructive w-full">{error}</p>}
        <p className="text-xs text-muted-foreground">
          {answeredCount < questions.length && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? 's' : ''} sans réponse
            </span>
          )}
        </p>
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Envoi…
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Soumettre
            </>
          )}
        </Button>
      </div>

      {/* Confirm submit */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Soumettre l&apos;examen ?</DialogTitle>
            <DialogDescription>
              {answeredCount < questions.length
                ? `Vous avez répondu à ${answeredCount} sur ${questions.length} questions. Les questions sans réponse seront comptées comme incorrectes.`
                : 'Tous vos réponses seront enregistrées. Cette action est définitive.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Annuler
            </Button>
            <Button onClick={doSubmit} disabled={isPending}>
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
