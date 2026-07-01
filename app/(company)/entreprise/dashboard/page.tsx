import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCompanyDashboard } from '@/app/actions/companies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Users, CalendarDays, FileText, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { CompanyInscriptionStatus, FormationType } from '@prisma/client'

export const metadata: Metadata = { title: 'Espace entreprise — MIA Académie' }

const INSCRIPTION_STATUS: Record<CompanyInscriptionStatus, { label: string; className: string }> = {
  PENDING:           { label: 'En attente',   className: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING_SIGNATURE: { label: 'En signature', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  ACCEPTED:          { label: 'Acceptée',      className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED:          { label: 'Refusée',       className: 'bg-red-100 text-red-700 border-red-200' },
}

const MODALITY: Record<FormationType, string> = {
  PRESENTIAL:   'Présentiel',
  REMOTE_LIVE:  'Distanciel (live)',
  REMOTE_ASYNC: 'Distanciel (async)',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

type DocLink = { label: string; url: string | null }

function DocumentRow({ label, url }: DocLink) {
  if (!url) return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Badge variant="outline" className="text-xs">Non disponible</Badge>
    </div>
  )
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
      >
        Télécharger <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}

export default async function CompanyDashboardPage() {
  const company = await getCompanyDashboard()
  if (!company) redirect('/login')

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <Building2 className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{company.raisonSociale}</h1>
          <p className="text-sm text-muted-foreground">
            {company.prenomDirigeant} {company.nomDirigeant} — {company.fonction}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Employees */}
        <Card className="gap-0 py-0 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-5 py-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">
              Salariés <span className="font-normal text-muted-foreground">({company.employees.length})</span>
            </CardTitle>
          </div>
          <div className="divide-y">
            {company.employees.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                Aucun salarié enregistré.
              </p>
            ) : (
              company.employees.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-[11px] font-semibold bg-muted">
                      {`${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{emp.firstName} {emp.lastName}</p>
                    {emp.email && <p className="text-xs text-muted-foreground truncate">{emp.email}</p>}
                  </div>
                  {emp.user && (
                    <Badge variant="outline" className="text-[10px] shrink-0 bg-green-50 text-green-700 border-green-200">
                      Inscrit
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right: Sessions */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {company.inscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Aucune session de formation assignée.
              </CardContent>
            </Card>
          ) : (
            company.inscriptions.map(ins => {
              const { label, className } = INSCRIPTION_STATUS[ins.status]
              const s = ins.trainingSession

              const docs: DocLink[] = [
                { label: 'Contrat',              url: ins.contratUrl },
                { label: 'Règlement intérieur',  url: ins.reglementUrl },
                { label: 'CGV',                  url: ins.cgvUrl },
                { label: 'Convocations',         url: ins.convocationsUrl },
                { label: "Plan d'accès",         url: ins.planAccesUrl },
              ]

              const hasAnyDoc = docs.some(d => d.url)

              return (
                <Card key={ins.id} className="overflow-hidden">
                  {/* Session header */}
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <CardTitle className="text-base">{s.formation.title}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.title}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={className}>{label}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    {/* Session details grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Dates</p>
                        <p className="font-medium">
                          {format(new Date(s.startDate), 'dd MMM', { locale: fr })} →{' '}
                          {format(new Date(s.endDate), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Modalité</p>
                        <p className="font-medium">{MODALITY[s.formation.type]}</p>
                      </div>
                      {s.formation.duration && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Durée</p>
                          <p className="font-medium">{s.formation.duration}h</p>
                        </div>
                      )}
                      {s.location && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Lieu</p>
                          <p className="font-medium">{s.location}</p>
                        </div>
                      )}
                    </div>

                    {/* Documents */}
                    {hasAnyDoc && (
                      <div className="rounded-lg border bg-muted/30 px-4 divide-y">
                        <div className="flex items-center gap-2 py-2.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Documents</span>
                        </div>
                        {docs.map(doc => (
                          <DocumentRow key={doc.label} label={doc.label} url={doc.url} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
