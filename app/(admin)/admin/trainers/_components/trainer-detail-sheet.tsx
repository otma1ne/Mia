'use client'

import { useEffect, useState, useTransition } from 'react'
import { getTrainer } from '@/app/actions/trainers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Mail, Phone, Calendar, BookOpen, Star, Award, Layers, GraduationCap, ExternalLink } from 'lucide-react'

type Trainer = NonNullable<Awaited<ReturnType<typeof getTrainer>>>

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

const EXPERTISE_LEVEL_LABELS: Record<string, string> = {
  DEBUTANT:      'Débutant',
  INTERMEDIAIRE: 'Intermédiaire',
  AVANCE:        'Avancé',
  EXPERT:        'Expert',
}

const courseStatusConfig = {
  DRAFT:     { label: 'Brouillon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PUBLISHED: { label: 'Publié',    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ARCHIVED:  { label: 'Archivé',   className: 'bg-muted text-muted-foreground' },
  COMPLETED: { label: 'Terminé',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
} as const

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

interface TrainerDetailSheetProps {
  trainerId: string | null
  onClose: () => void
}

export default function TrainerDetailSheet({ trainerId, onClose }: TrainerDetailSheetProps) {
  const [trainer, setTrainer] = useState<Trainer | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!trainerId) { setTrainer(null); return }
    startTransition(async () => {
      const data = await getTrainer(trainerId)
      setTrainer(data ?? null)
    })
  }, [trainerId])

  return (
    <Sheet open={!!trainerId} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto gap-0 p-0">
        {isPending || !trainer ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {isPending ? 'Chargement…' : 'Formateur introuvable.'}
            </span>
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={trainer.user.avatar ?? undefined} alt={trainer.user.name} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-base font-semibold">
                    {getInitials(trainer.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-base">{trainer.user.name}</SheetTitle>
                  <SheetDescription className="truncate text-xs">{trainer.user.email}</SheetDescription>
                  {trainer.rating !== null && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-amber-600 font-medium">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {trainer.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              {trainer.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{trainer.bio}</p>
              )}
            </SheetHeader>

            <Separator />

            {/* Contact */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Coordonnées</h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{trainer.user.email}</span>
                </li>
                {trainer.user.phone && (
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{trainer.user.phone}</span>
                  </li>
                )}
                <li className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    Inscrit le{' '}
                    {new Intl.DateTimeFormat('fr-FR', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    }).format(new Date(trainer.user.createdAt))}
                  </span>
                </li>
              </ul>
            </div>

            {/* Specializations */}
            {trainer.specializations.length > 0 && (
              <>
                <Separator />
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    Spécialisations
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.specializations.map(s => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Credentials */}
            {trainer.credentials.length > 0 && (
              <>
                <Separator />
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Award className="h-3.5 w-3.5" />
                    Diplômes &amp; certifications
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {trainer.credentials.map(c => (
                      <li key={c} className="text-sm flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Type de formation */}
            {trainer.categories.length > 0 && (
              <>
                <Separator />
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Type de formation
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.categories.map(c => (
                      <Badge key={c.id} variant="secondary">{c.name}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Niveau d'expertise */}
            {trainer.expertiseLevels.length > 0 && (
              <>
                <Separator />
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Niveau d&apos;expertise
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {trainer.expertiseLevels.map(level => (
                      <Badge key={level} variant="secondary">{EXPERTISE_LEVEL_LABELS[level] ?? level}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Documents */}
            <Separator />
            <div className="p-6 flex flex-col gap-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Documents
              </h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <a href={trainer.cvUrl} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                    <ExternalLink className="h-4 w-4" />Voir le CV
                  </a>
                </li>
                <li>
                  <a href={trainer.diplomeUrl} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                    <ExternalLink className="h-4 w-4" />Voir le diplôme
                  </a>
                </li>
                {trainer.certifQualiopiUrl && (
                  <li>
                    <a href={trainer.certifQualiopiUrl} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                      <ExternalLink className="h-4 w-4" />Certification Qualiopi
                    </a>
                  </li>
                )}
                {trainer.ndaUrl && (
                  <li>
                    <a href={trainer.ndaUrl} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                      <ExternalLink className="h-4 w-4" />NDA
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Availability */}
            {trainer.availability.length > 0 && (
              <>
                <Separator />
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Disponibilités
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {trainer.availability.map(a => (
                      <li key={a.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium w-10">{DAY_NAMES[a.dayOfWeek]}</span>
                        <span className="text-muted-foreground">{a.startTime} – {a.endTime}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <Separator />

            {/* Sessions */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                Séances assignées ({trainer.sessions.length})
              </h3>
              {trainer.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune séance assignée.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {trainer.sessions.map(session => (
                    <li key={session.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{session.formation.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.module.title} · {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(session.date))} {session.startTime}–{session.endTime}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
