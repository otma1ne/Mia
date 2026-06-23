'use client'

import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { acceptInscription, declineInscription } from '@/app/actions/inscriptions'
import type { Inscription, Formation } from '@prisma/client'
import type { InscriptionStatus } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ExternalLink, CheckCircle, XCircle, AlertCircle, Loader2, PenLine } from 'lucide-react'

type InscriptionWithFormation = Inscription & {
  formation: Pick<Formation, 'id' | 'title'>
}

interface Props {
  inscription: InscriptionWithFormation
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_MAP: Record<InscriptionStatus, { label: string; className: string }> = {
  PENDING:           { label: 'En attente',              className: 'bg-slate-100 text-slate-700 border-slate-200' },
  EVALUATED:         { label: 'Évaluée',                 className: 'bg-amber-100 text-amber-700 border-amber-200' },
  PENDING_SIGNATURE: { label: 'En attente de signature', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  ACCEPTED:          { label: 'Acceptée',                className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED:          { label: 'Refusée',                 className: 'bg-red-100 text-red-700 border-red-200' },
}

export default function InscriptionDetailSheet({ inscription, open, onOpenChange }: Props) {
  const [showDeclineNote, setShowDeclineNote] = useState(false)
  const [note, setNote]                       = useState('')
  const [error, setError]                     = useState('')
  const [isAccepting, startAcceptTransition]    = useTransition()
  const [isDeclining, startDeclineTransition]   = useTransition()

  const { label, className } = STATUS_MAP[inscription.status]

  function handleAccept() {
    setError('')
    startAcceptTransition(async () => {
      const result = await acceptInscription(inscription.id)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleDecline() {
    if (!showDeclineNote) {
      setShowDeclineNote(true)
      return
    }
    setError('')
    startDeclineTransition(async () => {
      const result = await declineInscription(inscription.id, note.trim() || undefined)
      if (result?.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-lg">
              {inscription.firstName} {inscription.lastName}
            </SheetTitle>
            <Badge variant="outline" className={className}>{label}</Badge>
          </div>
          <SheetDescription>
            Demande soumise le {format(new Date(inscription.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student info */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informations</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{inscription.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="font-medium">{inscription.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nationalité</dt>
                <dd className="font-medium">{inscription.nationality}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date de naissance</dt>
                <dd className="font-medium">{format(new Date(inscription.dateOfBirth), 'dd MMMM yyyy', { locale: fr })}</dd>
              </div>
              {inscription.postalAddress && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Adresse postale</dt>
                  <dd className="font-medium text-right">{inscription.postalAddress}</dd>
                </div>
              )}
              {inscription.poleEmploiId && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ID Pôle emploi</dt>
                  <dd className="font-medium">{inscription.poleEmploiId}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Formation</dt>
                <dd className="font-medium">{inscription.formation.title}</dd>
              </div>
            </dl>
          </section>

          <Separator />

          {/* Documents */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents</h3>
            <div className="flex flex-col gap-2">
              <a
                href={inscription.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                Voir le CV
              </a>

              {inscription.evaluationPdfUrl ? (
                <a
                  href={inscription.evaluationPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir l&apos;évaluation de besoins (PDF)
                </a>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Évaluation non encore soumise.
                </p>
              )}
            </div>
          </section>

          {/* Signed documents (if accepted) */}
          {inscription.signedContratUrl && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Documents signés</h3>
                <div className="flex flex-col gap-2">
                  <a href={inscription.signedContratUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                    <ExternalLink className="h-4 w-4" />Contrat signé
                  </a>
                  {inscription.signedReglementUrl && (
                    <a href={inscription.signedReglementUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                      <ExternalLink className="h-4 w-4" />Règlement intérieur signé
                    </a>
                  )}
                  {inscription.signedCgvUrl && (
                    <a href={inscription.signedCgvUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                      <ExternalLink className="h-4 w-4" />CGV signées
                    </a>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Signature proof */}
          {inscription.status === 'ACCEPTED' && inscription.signatureDataUrl && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preuve de signature</h3>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inscription.signatureDataUrl}
                  alt="Signature du candidat"
                  className="h-16 border rounded-lg bg-white px-3"
                />
                {inscription.signedIp && (
                  <p className="text-xs text-muted-foreground">
                    Signé depuis l&apos;IP {inscription.signedIp}
                    {inscription.signedAt && ` le ${format(new Date(inscription.signedAt), 'dd MMMM yyyy à HH:mm', { locale: fr })}`}
                  </p>
                )}
              </section>
            </>
          )}

          {/* Admin note (if declined) */}
          {inscription.adminNote && (
            <>
              <Separator />
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Note admin</h3>
                <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">{inscription.adminNote}</p>
              </section>
            </>
          )}

          {/* Pending signature info block */}
          {inscription.status === 'PENDING_SIGNATURE' && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Signature électronique</h3>
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800">
                  <PenLine className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Le lien de signature a été envoyé au candidat par email.
                    En attente de signature des documents contractuels (contrat, règlement intérieur, programme, CGV).
                  </p>
                </div>
              </section>
            </>
          )}

          {/* Actions — only for EVALUATED */}
          {inscription.status === 'EVALUATED' && (
            <>
              <Separator />
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Décision</h3>

                {showDeclineNote && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="declineNote">
                      Motif du refus (optionnel)
                    </label>
                    <textarea
                      id="declineNote"
                      rows={3}
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Expliquez brièvement la raison du refus…"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={handleAccept}
                    disabled={isAccepting || isDeclining}
                  >
                    {isAccepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    Accepter
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={handleDecline}
                    disabled={isAccepting || isDeclining}
                  >
                    {isDeclining ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    {showDeclineNote ? 'Confirmer le refus' : 'Refuser'}
                  </Button>
                </div>

                {showDeclineNote && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => { setShowDeclineNote(false); setNote('') }}
                  >
                    Annuler
                  </Button>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
