import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import logoSrc from '@/public/logo.png'
import { db } from '@/lib/db'
import {
  ArrowRight, BookOpen, MapPin, Monitor, Video,
  CalendarRange, Users, Clock, ChevronLeft, GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormationType, TrainingNiveau } from '@prisma/client'

const TYPE_CONFIG: Record<FormationType, { label: string; icon: typeof MapPin; className: string }> = {
  PRESENTIAL:   { label: 'Présentiel',    icon: MapPin,   className: 'bg-blue-50 text-blue-700 border-blue-200' },
  REMOTE_LIVE:  { label: 'En ligne live', icon: Monitor,  className: 'bg-violet-50 text-violet-700 border-violet-200' },
  REMOTE_ASYNC: { label: 'Autonome',      icon: Video,    className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const NIVEAU_LABELS: Record<TrainingNiveau, string> = {
  START:  'MIA Bronze – Niv. 1',
  PRO:    'MIA Argent – Niv. 2',
  EXPERT: 'MIA Or – Niv. 3',
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const formation = await db.formation.findUnique({
    where: { id, status: 'PUBLISHED' },
    select: { title: true, description: true },
  })
  if (!formation) return { title: 'Formation introuvable' }
  return {
    title: `${formation.title} — MIA Académie`,
    description: formation.description.slice(0, 160),
  }
}

export default async function FormationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const formation = await db.formation.findUnique({
    where: { id, status: 'PUBLISHED' },
    include: {
      category: { select: { name: true } },
      _count: { select: { modules: true, enrollments: true } },
      trainingSessions: {
        where: { status: { in: ['OPEN', 'STARTED'] } },
        orderBy: { startDate: 'asc' },
        include: {
          trainer: { include: { user: { select: { name: true } } } },
          _count: { select: { enrollments: true } },
        },
      },
    },
  })

  if (!formation) notFound()

  const typeCfg = TYPE_CONFIG[formation.type]
  const TypeIcon = typeCfg.icon

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm px-6">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <Image src={logoSrc} alt="MIA Académie" width={120} height={32} className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/courses" className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              ← Toutes les formations
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Mon espace
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="mx-auto max-w-5xl flex flex-col gap-10">

          {/* Back link */}
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 transition-colors w-fit">
            <ChevronLeft className="h-4 w-4" />
            Retour au catalogue
          </Link>

          {/* Hero */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {formation.category.name}
              </span>
              <span className="text-zinc-200">·</span>
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                typeCfg.className
              )}>
                <TypeIcon className="h-3 w-3" />
                {typeCfg.label}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{formation.title}</h1>
            <p className="text-base text-zinc-500 leading-relaxed max-w-2xl">{formation.description}</p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-5 text-sm text-zinc-500 pt-1">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-zinc-400" />
                {formation._count.modules} module{formation._count.modules !== 1 ? 's' : ''}
              </span>
              {formation.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  {formation.duration}h de formation
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-zinc-400" />
                {formation._count.enrollments} inscrit{formation._count.enrollments !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">

            {/* Sessions */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-base font-semibold text-zinc-900">Sessions disponibles</h2>

              {formation.trainingSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-zinc-50 py-12 flex flex-col items-center gap-3 text-center">
                  <CalendarRange className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm font-medium text-zinc-500">Aucune session ouverte en ce moment</p>
                  <p className="text-xs text-zinc-400">De nouvelles sessions sont régulièrement ajoutées.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {formation.trainingSessions.map(ts => {
                    const spots = ts.maxStudents - ts._count.enrollments
                    const isFull = spots <= 0
                    return (
                      <div key={ts.id} className="rounded-2xl border bg-white p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-zinc-900 leading-snug">{ts.title}</p>
                            {ts.niveau && (
                              <span className="inline-flex items-center gap-1 mt-1 text-xs text-zinc-500">
                                <GraduationCap className="h-3 w-3" />
                                {NIVEAU_LABELS[ts.niveau]}
                              </span>
                            )}
                          </div>
                          {isFull ? (
                            <span className="shrink-0 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-600">
                              Complet
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              Ouvert
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <CalendarRange className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            {format(new Date(ts.startDate), 'd MMM yyyy', { locale: fr })}
                            {' → '}
                            {format(new Date(ts.endDate), 'd MMM yyyy', { locale: fr })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                            {isFull
                              ? 'Complet'
                              : `${spots} place${spots !== 1 ? 's' : ''} disponible${spots !== 1 ? 's' : ''}`}
                          </span>
                          {ts.trainer?.user.name && (
                            <span className="flex items-center gap-1.5">
                              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                              {ts.trainer.user.name}
                            </span>
                          )}
                          {ts.price != null && (
                            <span className="font-medium text-zinc-700">
                              {ts.price.toLocaleString('fr-FR')} €
                            </span>
                          )}
                        </div>

                        {ts.location && (
                          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            {ts.location}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* CTA sidebar */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border bg-zinc-50 p-6 flex flex-col gap-5 sticky top-20">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Intéressé(e) par cette formation ?</p>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    Remplissez le formulaire de demande. Notre équipe vous contactera sous 24h pour vous présenter les modalités et confirmer votre inscription.
                  </p>
                </div>

                <Link
                  href={`/register?formation=${formation.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
                >
                  Faire une demande
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="text-[11px] text-zinc-400 text-center">
                  Vous serez contacté(e) sous 24h. Sans engagement.
                </p>

                <div className="border-t pt-4 flex flex-col gap-2 text-xs text-zinc-500">
                  <p className="font-medium text-zinc-700">Ce que vous recevrez</p>
                  {[
                    'Programme détaillé',
                    'Modalités de financement',
                    'Dates des prochaines sessions',
                    'Réponse sous 24h',
                  ].map(item => (
                    <span key={item} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white px-6 py-8 mt-8">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm text-zinc-900">
            <Image src={logoSrc} alt="MIA Académie" width={100} height={28} className="h-7 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>contact@mia-academie.com</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} MIA Académie</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
