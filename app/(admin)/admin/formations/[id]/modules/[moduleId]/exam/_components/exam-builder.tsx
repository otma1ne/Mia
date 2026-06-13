'use client'

import { useState, useTransition } from 'react'
import {
  createOrUpdateExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '@/app/actions/exams'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChevronUp, ChevronDown, Plus, Trash2, Edit, Check, X,
} from 'lucide-react'
import type { QuestionType } from '@prisma/client'

// ─────────────────────────────────────────
// Types from server
// ─────────────────────────────────────────

interface Choice {
  id: string
  text: string
  isCorrect: boolean
  orderIndex: number
}

interface Question {
  id: string
  text: string
  type: QuestionType
  points: number
  orderIndex: number
  correctAnswer: unknown
  choices: Choice[]
}

interface Exam {
  id: string
  title: string
  description: string | null
  passingScore: number
  timeLimit: number | null
  shuffleQuestions: boolean
  questions: Question[]
}

interface Props {
  moduleId: string
  exam: Exam | null
}

// ─────────────────────────────────────────
// Type labels
// ─────────────────────────────────────────

const typeLabel: Record<QuestionType, string> = {
  QCM: 'QCM',
  TRUE_FALSE: 'Vrai / Faux',
  OPEN: 'Question ouverte',
}

// ═════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════

export default function ExamBuilder({ moduleId, exam }: Props) {
  const [questionDialog, setQuestionDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; question: Question } | null
  >(null)
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Reorder ────────────────────────────────────────────────────────

  function move(index: number, direction: 'up' | 'down') {
    if (!exam) return
    const next = [...exam.questions]
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
    startTransition(async () => {
      await reorderQuestions(exam.id, next.map(q => q.id))
    })
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteQuestion(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* Settings form */}
      <ExamSettingsForm moduleId={moduleId} exam={exam} />

      {/* Questions section (only when exam is created) */}
      {exam && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Questions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exam.questions.length} question{exam.questions.length !== 1 ? 's' : ''} — total:{' '}
                {exam.questions.reduce((sum, q) => sum + q.points, 0)} point{exam.questions.reduce((sum, q) => sum + q.points, 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <Button size="sm" onClick={() => setQuestionDialog({ mode: 'create' })}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter une question
            </Button>
          </div>

          {exam.questions.length === 0 && (
            <Card className="py-12 text-center text-sm text-muted-foreground">
              Aucune question. Cliquez sur &quot;Ajouter une question&quot; pour commencer.
            </Card>
          )}

          <div className="space-y-2">
            {exam.questions.map((q, idx) => (
              <Card key={q.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Reorder */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                    <Button
                      variant="ghost" size="icon" className="h-5 w-5"
                      disabled={idx === 0 || isPending}
                      onClick={() => move(idx, 'up')}
                      aria-label="Monter"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <span className="text-xs font-semibold text-muted-foreground tabular-nums w-6 text-center">
                      #{idx + 1}
                    </span>
                    <Button
                      variant="ghost" size="icon" className="h-5 w-5"
                      disabled={idx === exam.questions.length - 1 || isPending}
                      onClick={() => move(idx, 'down')}
                      aria-label="Descendre"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                        {typeLabel[q.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {q.points} pt{q.points !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{q.text}</p>
                    {q.type === 'QCM' && (
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {q.choices.map(c => (
                          <li key={c.id} className="flex items-center gap-1.5">
                            {c.isCorrect ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <X className="h-3 w-3 text-muted-foreground/50" />
                            )}
                            <span className={c.isCorrect ? 'text-emerald-700 dark:text-emerald-500' : ''}>{c.text}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {q.type === 'TRUE_FALSE' && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Réponse correcte :{' '}
                        <span className="font-medium text-emerald-700 dark:text-emerald-500">
                          {(q.correctAnswer as { correct: boolean } | null)?.correct ? 'Vrai' : 'Faux'}
                        </span>
                      </p>
                    )}
                    {q.type === 'OPEN' && (
                      <p className="mt-1 text-xs text-muted-foreground italic">
                        Corrigée manuellement par le formateur
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => setQuestionDialog({ mode: 'edit', question: q })}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                      onClick={() => setDeleteTarget(q)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Question dialog */}
      {questionDialog && exam && (
        <QuestionDialog
          examId={exam.id}
          mode={questionDialog.mode}
          question={questionDialog.mode === 'edit' ? questionDialog.question : undefined}
          onClose={() => setQuestionDialog(null)}
        />
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la question</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════
// Exam settings form
// ═════════════════════════════════════════════════════════════════

function ExamSettingsForm({ moduleId, exam }: { moduleId: string; exam: Exam | null }) {
  const [title, setTitle] = useState(exam?.title ?? '')
  const [description, setDescription] = useState(exam?.description ?? '')
  const [passingScore, setPassingScore] = useState(exam?.passingScore ?? 70)
  const [timeLimit, setTimeLimit] = useState<number | ''>(exam?.timeLimit ?? '')
  const [shuffle, setShuffle] = useState(exam?.shuffleQuestions ?? false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await createOrUpdateExam(moduleId, {
        title: title.trim(),
        description: description.trim() || null,
        passingScore,
        timeLimit: timeLimit === '' ? null : Number(timeLimit),
        shuffleQuestions: shuffle,
      })
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <Card>
      <CardContent className="py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre de l&apos;examen</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="Ex. Examen final — Code de la route"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optionnelle)</Label>
            <textarea
              id="description"
              value={description ?? ''}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
              placeholder="Instructions ou contexte affichés avant le début de l'examen."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="passingScore">Note de passage (%)</Label>
              <Input
                id="passingScore"
                type="number"
                min={0} max={100}
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeLimit">Durée limite (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                min={0}
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Aucune limite"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={shuffle}
              onChange={e => setShuffle(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Mélanger l&apos;ordre des questions à chaque tentative
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Enregistré.</p>}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : exam ? 'Mettre à jour' : 'Créer l\'examen'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ═════════════════════════════════════════════════════════════════
// Question create/edit dialog
// ═════════════════════════════════════════════════════════════════

interface QCMChoice { text: string; isCorrect: boolean }

function QuestionDialog({
  examId,
  mode,
  question,
  onClose,
}: {
  examId: string
  mode: 'create' | 'edit'
  question?: Question
  onClose: () => void
}) {
  const [text, setText] = useState(question?.text ?? '')
  const [type, setType] = useState<QuestionType>(question?.type ?? 'QCM')
  const [points, setPoints] = useState(question?.points ?? 1)
  const [correctBoolean, setCorrectBoolean] = useState<boolean>(
    (question?.correctAnswer as { correct: boolean } | null)?.correct ?? true
  )
  const [choices, setChoices] = useState<QCMChoice[]>(
    question?.choices.map(c => ({ text: c.text, isCorrect: c.isCorrect })) ?? [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ]
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function updateChoice(idx: number, patch: Partial<QCMChoice>) {
    setChoices(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  function setCorrectChoice(idx: number) {
    // single-correct QCM: radio behavior
    setChoices(prev => prev.map((c, i) => ({ ...c, isCorrect: i === idx })))
  }

  function addChoice() {
    setChoices(prev => [...prev, { text: '', isCorrect: false }])
  }

  function removeChoice(idx: number) {
    setChoices(prev => prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (type === 'QCM') {
      const valid = choices.filter(c => c.text.trim())
      if (valid.length < 2) {
        setError('Au moins 2 choix sont requis.')
        return
      }
      if (!valid.some(c => c.isCorrect)) {
        setError('Au moins un choix doit être correct.')
        return
      }
    }

    startTransition(async () => {
      const payload = {
        text: text.trim(),
        type,
        points,
        correctBoolean: type === 'TRUE_FALSE' ? correctBoolean : undefined,
        choices: type === 'QCM' ? choices.filter(c => c.text.trim()) : undefined,
      }

      const result = mode === 'create'
        ? await addQuestion(examId, payload)
        : await updateQuestion(question!.id, payload)

      if (result?.error) setError(result.error)
      else onClose()
    })
  }

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouvelle question' : 'Modifier la question'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="q-text">Question</Label>
            <textarea
              id="q-text"
              value={text}
              onChange={e => setText(e.target.value)}
              required
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:border-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="q-type">Type</Label>
              <Select value={type} onValueChange={v => setType(v as QuestionType)}>
                <SelectTrigger id="q-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QCM">QCM</SelectItem>
                  <SelectItem value="TRUE_FALSE">Vrai / Faux</SelectItem>
                  <SelectItem value="OPEN">Question ouverte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="q-points">Points</Label>
              <Input
                id="q-points"
                type="number" min={1}
                value={points}
                onChange={e => setPoints(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* QCM choices */}
          {type === 'QCM' && (
            <div className="space-y-2">
              <Label>Choix (cochez la bonne réponse)</Label>
              {choices.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct-choice"
                    checked={c.isCorrect}
                    onChange={() => setCorrectChoice(idx)}
                    className="h-4 w-4"
                  />
                  <Input
                    value={c.text}
                    onChange={e => updateChoice(idx, { text: e.target.value })}
                    placeholder={`Choix ${idx + 1}`}
                  />
                  {choices.length > 2 && (
                    <Button
                      type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                      onClick={() => removeChoice(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addChoice}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter un choix
              </Button>
            </div>
          )}

          {/* True/False selector */}
          {type === 'TRUE_FALSE' && (
            <div className="space-y-1.5">
              <Label>Réponse correcte</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={correctBoolean ? 'default' : 'outline'}
                  onClick={() => setCorrectBoolean(true)}
                  size="sm"
                >
                  Vrai
                </Button>
                <Button
                  type="button"
                  variant={!correctBoolean ? 'default' : 'outline'}
                  onClick={() => setCorrectBoolean(false)}
                  size="sm"
                >
                  Faux
                </Button>
              </div>
            </div>
          )}

          {/* Open question note */}
          {type === 'OPEN' && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-300">
              Cette question sera corrigée manuellement par un formateur après la soumission.
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : mode === 'create' ? 'Ajouter' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
