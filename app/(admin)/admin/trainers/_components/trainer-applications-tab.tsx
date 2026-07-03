'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { TrainerApplicationRow } from '@/app/actions/trainer-applications'
import TrainerApplicationDetailSheet from './trainer-application-detail-sheet'

const STATUS_TABS: { label: string; value: 'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED' }[] = [
  { label: 'Toutes',     value: 'ALL' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Acceptées',  value: 'ACCEPTED' },
  { label: 'Refusées',   value: 'DECLINED' },
]

const STATUS_MAP = {
  PENDING:  { label: 'En attente', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  ACCEPTED: { label: 'Acceptée',   className: 'bg-green-100 text-green-700 border-green-200' },
  DECLINED: { label: 'Refusée',    className: 'bg-red-100 text-red-700 border-red-200' },
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

interface TrainerApplicationsTabProps {
  applications: TrainerApplicationRow[]
}

export default function TrainerApplicationsTab({ applications }: TrainerApplicationsTabProps) {
  const [activeTab, setActiveTab]     = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'DECLINED'>('ALL')
  const [selected, setSelected]       = useState<TrainerApplicationRow | null>(null)
  const [sheetOpen, setSheetOpen]     = useState(false)

  const filtered = activeTab === 'ALL'
    ? applications
    : applications.filter(a => a.status === activeTab)

  function openSheet(application: TrainerApplicationRow) {
    setSelected(application)
    setSheetOpen(true)
  }

  return (
    <>
      {/* Status tabs */}
      <div className="flex gap-0.5 flex-wrap">
        {STATUS_TABS.map(tab => {
          const count    = tab.value === 'ALL' ? applications.length : applications.filter(a => a.status === tab.value).length
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                isActive ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              ].join(' ')}
            >
              {tab.label} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          )
        })}
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Aucune candidature</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidat</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Compétences</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(application => {
                const { label, className } = STATUS_MAP[application.status]
                return (
                  <TableRow
                    key={application.id}
                    className="cursor-pointer"
                    onClick={() => openSheet(application)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                          {getInitials(application.firstName, application.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{application.firstName} {application.lastName}</p>
                          <p className="text-xs text-muted-foreground truncate">{application.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{application.city}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {application.skills.slice(0, 3).map(s => (
                          <Badge key={s.skillId} variant="outline" className="text-[10px] px-1.5 py-0">
                            {s.name}
                          </Badge>
                        ))}
                        {application.skills.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                            +{application.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(application.createdAt, 'd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={className}>{label}</Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {selected && (
        <TrainerApplicationDetailSheet
          application={selected}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
