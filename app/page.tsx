import Link from 'next/link'
import {
  BookOpen,
  Users,
  CalendarDays,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Clock,
  Code2,
  Briefcase,
  Palette,
  type LucideIcon,
} from 'lucide-react'
import { db } from '@/lib/db'

function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase()
  if (n.includes('développement') || n.includes('web') || n.includes('mobile') || n.includes('code')) return Code2
  if (n.includes('data') || n.includes('ia') || n.includes('intelligence') || n.includes('science')) return TrendingUp
  if (n.includes('business') || n.includes('management') || n.includes('marketing')) return Briefcase
  if (n.includes('design') || n.includes('ux') || n.includes('ui') || n.includes('graphique')) return Palette
  if (n.includes('langue') || n.includes('anglais') || n.includes('français')) return Users
  return BookOpen
}

const schedule = [
  { day: 'Lun – Ven', hours: '08h30 – 19h00' },
  { day: 'Samedi',    hours: '09h00 – 13h00' },
  { day: 'Dimanche',  hours: 'Fermé' },
]

export default async function HomePage() {
  const rawCategories = await db.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { formations: true } } },
  })

  const categories = rawCategories.map(c => ({
    icon: categoryIcon(c.name),
    title: c.name,
    description: c.description ?? '',
    count: c._count.formations,
  }))
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      {/* ── Navbar ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur-sm px-6">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm">
            <div className="w-7 h-7 bg-[#1e2128] rounded-md flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            EduDrive
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/courses"
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              Nos formations
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-[#1e2128] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Accéder à mon espace
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#1e2128] px-6 py-24 sm:py-32">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-slate-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs text-white/70">
            <MapPin className="h-3.5 w-3.5" />
            Casablanca, Maroc
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl leading-tight">
            Bienvenue à<br />
            <span className="text-white/60">l&apos;Académie EduDrive</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-white/70 leading-relaxed">
            Auto-école agréée spécialisée dans la formation permis de conduire. Réussissez votre permis (B, A, C, BE) grâce à nos moniteurs experts et notre plateforme moderne.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1e2128] shadow-sm transition-colors hover:bg-zinc-100"
            >
              Accéder à mon espace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Découvrir nos formations
            </Link>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Nos domaines de formation</h2>
            <p className="mt-3 text-zinc-500 max-w-xl mx-auto">
              Des programmes conçus pour répondre aux exigences du marché de l&apos;emploi actuel.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ icon: Icon, title, description, count }) => (
              <div key={title} className="rounded-2xl border bg-white p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-zinc-700" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-zinc-900 text-sm">{title}</p>
                  <p className="mt-1.5 text-sm text-zinc-500 leading-relaxed">{description}</p>
                </div>
                <span className="text-xs font-medium text-zinc-400">
                  {count} formation{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Voir toutes les formations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Role portals ─────────────────────────────────────── */}
      <section className="bg-zinc-50 px-6 py-20 border-y">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Votre espace personnel</h2>
            <p className="mt-3 text-zinc-500">
              Chaque rôle dispose d&apos;un tableau de bord adapté à ses besoins.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                role: 'Étudiant',
                colour: 'bg-sky-50 border-sky-100',
                iconColour: 'bg-sky-100 text-sky-700',
                points: [
                  "S'inscrire aux formations",
                  'Suivre sa progression',
                  'Consulter son planning',
                  'Accéder aux ressources',
                ],
              },
              {
                role: 'Formateur',
                colour: 'bg-emerald-50 border-emerald-100',
                iconColour: 'bg-emerald-100 text-emerald-700',
                points: [
                  'Gérer ses formations',
                  'Marquer les présences',
                  'Suivre les étudiants',
                  'Partager des ressources',
                ],
              },
              {
                role: 'Administrateur',
                colour: 'bg-violet-50 border-violet-100',
                iconColour: 'bg-violet-100 text-violet-700',
                points: [
                  'Gérer les formations & salles',
                  'Gérer les formateurs',
                  'Superviser les inscriptions',
                  'Rapports & statistiques',
                ],
              },
            ].map(({ role, colour, iconColour, points }) => (
              <div key={role} className={`rounded-2xl border p-6 flex flex-col gap-4 ${colour}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${iconColour}`}>
                  {role[0]}
                </div>
                <p className="font-semibold text-zinc-900">{role}</p>
                <ul className="flex flex-col gap-2 flex-1">
                  {points.map(p => (
                    <li key={p} className="flex items-start gap-2 text-sm text-zinc-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 hover:text-zinc-900 transition-colors"
                >
                  Se connecter <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Info & Contact ───────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl grid gap-10 sm:grid-cols-2 items-start">
          {/* About */}
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-4">À propos du centre</h2>
            <p className="text-zinc-500 leading-relaxed text-sm">
              L&apos;Académie EduDrive est un centre de formation professionnelle certifié, basé à
              Casablanca. Nous accompagnons les apprenants dans leur montée en compétences grâce
              à des programmes structurés, des formateurs expérimentés et un environnement
              d&apos;apprentissage moderne.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-start gap-3 text-sm text-zinc-600">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-zinc-400" />
                45 Avenue de la Formation, Casablanca 20250, Maroc
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                +212 522 456 789
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                contact@edudrive.ma
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-4">Horaires d&apos;ouverture</h2>
            <div className="rounded-2xl border bg-zinc-50 divide-y overflow-hidden">
              {schedule.map(({ day, hours }) => (
                <div key={day} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <Clock className="h-4 w-4 text-zinc-400" />
                    {day}
                  </div>
                  <span className={`text-sm ${hours === 'Fermé' ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                    {hours}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              * Les horaires peuvent varier pendant les périodes de vacances.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-[#1e2128] px-6 py-16 relative overflow-hidden">
        <div className="absolute -top-20 right-0 w-72 h-72 bg-slate-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Vous êtes déjà inscrit ?
          </h2>
          <p className="mt-3 text-white/60 text-sm">
            Connectez-vous pour accéder à votre espace, consulter vos formations et suivre votre progression.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#1e2128] transition-colors hover:bg-zinc-100"
            >
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
            >
              Créer un compte étudiant
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-sm text-zinc-900">
            <div className="w-6 h-6 bg-[#1e2128] rounded flex items-center justify-center shrink-0">
              <GraduationCap className="w-3.5 h-3.5 text-white" />
            </div>
            EduDrive
          </Link>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>contact@edudrive.ma</span>
            <span>·</span>
            <span>+212 522 456 789</span>
            <span>·</span>
            <span>© {new Date().getFullYear()} Académie EduDrive</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
