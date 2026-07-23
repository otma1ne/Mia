'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Users, CalendarDays, Building2, Mail, Phone, FileSignature, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { removeCompanyEmployee, generateCompanyDocuments } from '@/app/actions/companies'
import AddEmployeeDialog from './add-employee-dialog'
import AssignSessionDialog from './assign-session-dialog'
import type { CompanyInscriptionStatus, FormationType } from '@prisma/client'

type Employee = {
  id:        string
  firstName: string
  lastName:  string
  email:     string | null
  phone:     string | null
  user:      { id: string; name: string; email: string } | null
}

type Inscription = {
  id:     string
  status: CompanyInscriptionStatus
  createdAt: Date
  trainingSession: {
    id:        string
    title:     string
    startDate: Date
    endDate:   Date
    location:  string | null
    formation: { title: string; type: FormationType; duration: number | null }
  }
}

type SessionOption = {
  id:        string
  title:     string
  startDate: Date
  endDate:   Date
  formation: { title: string }
}

interface CompanyDetailClientProps {
  companyId:        string
  raisonSociale:    string
  nomSignataire:    string
  prenomSignataire: string
  fonction:         string
  email:            string
  phone:            string
  siret:            string | null
  adresse:          string | null
  ville:            string | null
  codePostal:       string | null
  employees:        Employee[]
  inscriptions:     Inscription[]
  sessions:         SessionOption[]
}

const INSCRIPTION_STATUS: Record<CompanyInscriptionStatus, { label: string; className: string }> = {
  PENDING:           { label: 'En attente',    className: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING_SIGNATURE: { label: 'En signature',  className: 'bg-blue-100 text-blue-700 border-blue-200' },
  ACCEPTED:          { label: 'Acceptée',       className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED:          { label: 'Refusée',        className: 'bg-red-100 text-red-700 border-red-200' },
}

const MODALITY_LABEL: Record<FormationType, string> = {
  PRESENTIAL:   'Présentiel',
  REMOTE_LIVE:  'Distanciel (live)',
  REMOTE_ASYNC: 'Distanciel (async)',
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export default function CompanyDetailClient({
  companyId, raisonSociale, nomSignataire, prenomSignataire, fonction,
  email, phone, siret, adresse, ville, codePostal, employees, inscriptions, sessions,
}: CompanyDetailClientProps) {
  const [isPending, startTransition] = useTransition()
  const [generateErrors, setGenerateErrors] = useState<Record<string, string>>({})

  function handleRemoveEmployee(employeeId: string) {
    startTransition(async () => {
      await removeCompanyEmployee(employeeId, companyId)
    })
  }

  function handleGenerateDocs(inscriptionId: string) {
    setGenerateErrors(prev => ({ ...prev, [inscriptionId]: '' }))
    startTransition(async () => {
      const result = await generateCompanyDocuments(inscriptionId, companyId)
      if (result?.error) {
        setGenerateErrors(prev => ({ ...prev, [inscriptionId]: result.error! }))
      }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left column */}
      <div className="flex flex-col gap-6">
        {/* Company info card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">{raisonSociale}</CardTitle>
                {siret && <p className="text-xs text-muted-foreground mt-0.5">SIRET {siret}</p>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Signataire</p>
              <p className="mt-0.5 font-medium">{prenomSignataire} {nomSignataire}</p>
              <p className="text-muted-foreground">{fonction}</p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a href={`mailto:${email}`} className="hover:text-foreground">{email}</a>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{phone}</span>
            </div>
            {(adresse || ville || codePostal) && (
              <div className="text-muted-foreground">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Adresse</p>
                {adresse && <p>{adresse}</p>}
                {(codePostal || ville) && (
                  <p>{[codePostal, ville].filter(Boolean).join(' ')}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right column — employees + inscriptions */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        {/* Employees */}
        <Card className="gap-0 py-0 overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Salariés <span className="ml-1 text-muted-foreground font-normal">({employees.length})</span>
              </h2>
            </div>
            <AddEmployeeDialog companyId={companyId} />
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 text-xs">Salarié</TableHead>
                <TableHead className="px-5 text-xs">Contact</TableHead>
                <TableHead className="px-5 text-xs">Compte</TableHead>
                <TableHead className="w-10 px-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Aucun salarié enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map(emp => (
                  <TableRow key={emp.id}>
                    <TableCell className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-[11px] font-semibold bg-muted">
                            {getInitials(emp.firstName, emp.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{emp.firstName} {emp.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {emp.email && <span>{emp.email}</span>}
                        {emp.phone && <span className="text-xs">{emp.phone}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      {emp.user
                        ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Compte actif</Badge>
                        : <Badge variant="outline" className="text-xs text-muted-foreground">Sans compte</Badge>}
                    </TableCell>
                    <TableCell className="px-5 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveEmployee(emp.id)}
                        disabled={isPending}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Inscriptions / Sessions */}
        <Card className="gap-0 py-0 overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">
                Sessions de formation <span className="ml-1 text-muted-foreground font-normal">({inscriptions.length})</span>
              </h2>
            </div>
            <AssignSessionDialog companyId={companyId} sessions={sessions} />
          </div>

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-5 text-xs">Formation</TableHead>
                <TableHead className="px-5 text-xs">Dates</TableHead>
                <TableHead className="px-5 text-xs">Modalité</TableHead>
                <TableHead className="px-5 text-xs">Durée</TableHead>
                <TableHead className="px-5 text-xs">Statut</TableHead>
                <TableHead className="px-5 text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">
                    Aucune session assignée.
                  </TableCell>
                </TableRow>
              ) : (
                inscriptions.map(ins => {
                  const { label, className } = INSCRIPTION_STATUS[ins.status]
                  const s = ins.trainingSession
                  const genError = generateErrors[ins.id]
                  return (
                    <TableRow key={ins.id}>
                      <TableCell className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-sm">{s.formation.title}</span>
                          <span className="text-xs text-muted-foreground">{s.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                        {format(new Date(s.startDate), 'dd MMM', { locale: fr })} →{' '}
                        {format(new Date(s.endDate), 'dd MMM yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm">
                        {MODALITY_LABEL[s.formation.type]}
                        {s.location && <span className="block text-xs text-muted-foreground">{s.location}</span>}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-sm text-muted-foreground">
                        {s.formation.duration ? `${s.formation.duration}h` : '—'}
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        <Badge variant="outline" className={className}>{label}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3">
                        {ins.status === 'PENDING' && (
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => handleGenerateDocs(ins.id)}
                              disabled={isPending}
                            >
                              {isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <FileSignature className="h-3 w-3" />
                              )}
                              Générer &amp; envoyer
                            </Button>
                            {genError && (
                              <p className="text-xs text-destructive">{genError}</p>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
