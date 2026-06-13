'use client'

import { useEffect, useState, useTransition } from 'react'
import { getStudent } from '@/app/actions/students'
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
import { Mail, Phone, Calendar, BookOpen } from 'lucide-react'

type Student = NonNullable<Awaited<ReturnType<typeof getStudent>>>

const enrollmentStatusConfig = {
  ACTIVE:    { label: 'Actif',     className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  COMPLETED: { label: 'Terminé',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DROPPED:   { label: 'Abandonné', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  SUSPENDED: { label: 'Suspendu',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
} as const

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

interface StudentDetailSheetProps {
  studentId: string | null
  onClose: () => void
}

export default function StudentDetailSheet({ studentId, onClose }: StudentDetailSheetProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!studentId) {
      setStudent(null)
      return
    }
    startTransition(async () => {
      const data = await getStudent(studentId)
      setStudent(data ?? null)
    })
  }, [studentId])

  return (
    <Sheet open={!!studentId} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto gap-0 p-0">
        {isPending || !student ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {isPending ? 'Chargement…' : 'Étudiant introuvable.'}
            </span>
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage src={student.avatar ?? undefined} alt={student.name} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-base font-semibold">
                    {getInitials(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">{student.name}</SheetTitle>
                  <SheetDescription className="truncate text-xs">{student.email}</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Separator />

            {/* Details */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Coordonnées
              </h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{student.email}</span>
                </li>
                {student.phone && (
                  <li className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{student.phone}</span>
                  </li>
                )}
                <li className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    Inscrit le{' '}
                    {new Intl.DateTimeFormat('fr-FR', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(new Date(student.createdAt))}
                  </span>
                </li>
              </ul>
            </div>

            <Separator />

            {/* Enrollments */}
            <div className="p-6 flex flex-col gap-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" />
                Formations ({student.formationEnrollments.length})
              </h3>

              {student.formationEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune inscription pour l&apos;instant.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {student.formationEnrollments.map(enrollment => {
                    const cfg = enrollmentStatusConfig[enrollment.status]
                    return (
                      <li key={enrollment.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{enrollment.formation.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {enrollment.formation.type === 'PRESENTIAL' ? 'Présentiel' : 'À distance'}
                          </p>
                        </div>
                        <Badge className={cfg.className}>
                          {cfg.label}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
