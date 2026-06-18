'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  BookOpen, Users, CalendarDays, Settings,
  ChevronDown, Mail, MessageCircle, FileText,
  GraduationCap, ClipboardList, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FAQ_ITEMS = [
  {
    q: 'Comment m\'inscrire à une formation permis ?',
    a: 'Vous pouvez vous inscrire directement depuis la page "Parcourir les formations". Sélectionnez la formation souhaitée (Permis B, A, C, etc.) et cliquez sur "S\'inscrire". Vous recevrez un email de confirmation avec les prochaines étapes.',
  },
  {
    q: 'Comment réserver une séance de conduite ?',
    a: 'Depuis votre tableau de bord, allez à "Planning" et cliquez sur les crénaux disponibles. Vous pouvez voir les créneaux libres avec votre moniteur et réserver directement. Les confirmations de séance sont envoyées par email.',
  },
  {
    q: 'Comment puis-je suivre ma progression vers le permis ?',
    a: 'Consultez votre tableau de bord qui affiche votre progression en modules (Code, Conduite, Évaluations). Chaque module complété est marqué et vous pouvez voir votre taux de réussite aux examens blancs.',
  },
  {
    q: 'Quels sont les modules disponibles dans une formation ?',
    a: 'Chaque formation contient des modules Théorie (Code de la route), Pratique (Conduite avec moniteur) et Évaluations. Les modules sont adaptés au type de permis choisi.',
  },
  {
    q: 'Puis-je annuler une séance de conduite ?',
    a: 'Oui. Vous pouvez annuler une séance au moins 24h à l\'avance depuis votre Planning. Pour les annulations sous 24h, veuillez contacter directement votre moniteur.',
  },
  {
    q: 'Comment sont calculées les alertes sur les véhicules ?',
    a: 'Les alertes signalent quand une visite technique ou une assurance est sur le point d\'expirer. Ces alertes sont envoyées par email 30 jours avant la date limite (délai configurable par l\'administrateur).',
  },
  {
    q: 'Puis-je modifier mon mot de passe ?',
    a: 'Oui. Allez dans "Paramètres" et cliquez sur "Modifier mon mot de passe". Vous serez invité à entrer votre mot de passe actuel et votre nouveau mot de passe.',
  },
  {
    q: 'Que faire si je n\'apparais pas dans la liste de présence ?',
    a: 'Contactez immédiatement votre moniteur ou l\'administrateur du centre. Ils vérifieront votre inscription à la séance et corrigeront la présence en cas d\'erreur.',
  },
]

const QUICK_LINKS = [
  { icon: GraduationCap, label: 'Formations permis',        desc: 'Créer et gérer les formations (Permis B, A, C, BE, etc.)' },
  { icon: Users,         label: 'Gestion des élèves',       desc: 'Ajouter des élèves, moniteurs et gérer les rôles' },
  { icon: CalendarDays,  label: 'Planning des séances',     desc: 'Organiser les séances de conduite et réserver les véhicules' },
  { icon: ClipboardList, label: 'Suivi des présences',      desc: 'Enregistrer les présences aux séances et examens blancs' },
  { icon: BarChart3,     label: 'Progression élève',        desc: 'Suivre les résultats en code, conduite et évaluations' },
  { icon: Settings,      label: 'Gestion du centre',        desc: 'Configurer les véhicules, alertes et les informations du centre' },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-zinc-900 hover:text-zinc-700 transition-colors"
      >
        {q}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  )
}

export default function HelpContent() {
  return (
    <div className="flex flex-col gap-10 p-4 lg:p-6 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Aide et support</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Trouvez des réponses aux questions fréquentes et apprenez à utiliser MIA Formation.
        </p>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          Guides rapides
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ icon: Icon, label, desc }) => (
            <Card key={label} className="cursor-default hover:shadow-sm transition-shadow">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          Questions fréquentes
        </h2>
        <Card>
          <CardContent className="px-5 py-1">
            {FAQ_ITEMS.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Contact */}
      <div>
        <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          Besoin d&apos;aide supplémentaire ?
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Support par e-mail</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Envoyez-nous un message et nous vous répondrons dans les 24 heures.
                </p>
                <a
                  href="mailto:support@miaformation.ma"
                  className="mt-2 inline-block text-xs font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                >
                  support@miaformation.ma
                </a>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Documentation</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Guides détaillés et références pour chaque fonctionnalité d&apos;MIA Formation.
                </p>
                <span className="mt-2 inline-block text-xs text-muted-foreground">
                  Bientôt disponible
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
