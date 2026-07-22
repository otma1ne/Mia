'use client'

import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  acceptTrainerApplication,
  declineTrainerApplication,
  updateTrainerApplicationNote,
} from '@/app/actions/trainer-applications'
import type { TrainerApplicationRow } from '@/app/actions/trainer-applications'
import { ExternalLink, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const LEVEL_LABELS: Record<string, string> = {
  DEBUTANT:      'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE:        'Avancé',
  EXPERT:        'Expert',
}

const STATUS_MAP = {
  PENDING:  { label: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Acceptée',   className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED: { label: 'Refusée',    className: 'bg-red-100 text-red-700 border-red-200' },
}

interface Props {
  application: TrainerApplicationRow
  open:        boolean
  onOpenChange:(open: boolean) => void
}

export default function TrainerApplicationDetailSheet({ application, open, onOpenChange }: Props) {
  const [showDecline, setShowDecline]     = useState(false)
  const [note, setNote]                   = useState(application.adminNote ?? '')
  const [error, setError]                 = useState('')
  const [isAccepting, startAccept]        = useTransition()
  const [isDeclining, startDecline]       = useTransition()

  const { label, className } = STATUS_MAP[application.status]
  const fullName = `${application.firstName} ${application.lastName}`

  function handleAccept() {
    setError('')
    startAccept(async () => {
      const result = await acceptTrainerApplication(application.id)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleDecline() {
    if (!showDecline) { setShowDecline(true); return }
    setError('')
    startDecline(async () => {
      const result = await declineTrainerApplication(application.id, note.trim() || undefined)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleNoteBlur() {
    updateTrainerApplicationNote(application.id, note).catch(() => {})
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
              {application.firstName[0]}{application.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base">{fullName}</SheetTitle>
              <SheetDescription className="text-xs">{application.email}</SheetDescription>
            </div>
            <Badge variant="outline" className={className}>{label}</Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-6 px-6 py-6">
          {/* Infos */}
          <section className="flex flex-col gap-2 text-sm">
            <p><span className="text-muted-foreground w-20 inline-block">Téléphone</span>{application.phone}</p>
            <p><span className="text-muted-foreground w-20 inline-block">Ville</span>{application.city}</p>
            <p><span className="text-muted-foreground w-20 inline-block">Date</span>{format(application.createdAt, 'd MMM yyyy', { locale: fr })}</p>
          </section>

          <Separator />

          {/* Bio */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Présentation</p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{application.bio}</p>
          </section>

          <Separator />

          {/* Skills */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Compétences</p>
            <div className="flex flex-wrap gap-2">
              {application.skills.map(s => (
                <Badge key={s.skillId} variant="outline" className="text-xs">
                  {s.name} · {LEVEL_LABELS[s.level] ?? s.level}
                </Badge>
              ))}
            </div>
          </section>

          <Separator />

          {/* Documents */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Documents</p>
            <div className="flex flex-col gap-2">
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 hover:underline"
              >
                <FileText className="h-4 w-4" />
                CV
                <ExternalLink className="h-3 w-3" />
              </a>
              {application.diplomeUrls.map((url, i) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Diplôme {i + 1}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </section>

          <Separator />

          {/* Admin note */}
          <section>
            <Label htmlFor="adminNote" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
              Note interne
            </Label>
            <Textarea
              id="adminNote"
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Notes visibles uniquement par les admins…"
              rows={3}
              className="resize-none text-sm"
            />
          </section>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          {application.status === 'PENDING' && (
            <div className="flex flex-col gap-3">
              {showDecline ? (
                <>
                  <p className="text-sm text-muted-foreground">La note interne sera enregistrée avec le refus.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowDecline(false)}>
                      Annuler
                    </Button>
                    <Button variant="destructive" className="flex-1" disabled={isDeclining} onClick={handleDecline}>
                      {isDeclining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmer le refus'}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={handleDecline}>
                    Refuser
                  </Button>
                  <Button className="flex-1 bg-violet-600 hover:bg-violet-700" disabled={isAccepting} onClick={handleAccept}>
                    {isAccepting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création…</>
                      : <><CheckCircle className="mr-2 h-4 w-4" /> Accepter</>}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
