'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import InscriptionDetailSheet from './inscription-detail-sheet'
import type { Inscription, Formation } from '@prisma/client'
import type { InscriptionStatus } from '@prisma/client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type InscriptionWithFormation = Inscription & {
  formation: Pick<Formation, 'id' | 'title'>
}

interface InscriptionsClientProps {
  inscriptions: InscriptionWithFormation[]
}

const STATUS_TABS: { label: string; value: InscriptionStatus | 'ALL' }[] = [
  { label: 'Toutes',       value: 'ALL' },
  { label: 'En attente',   value: 'PENDING' },
  { label: 'Évaluées',     value: 'EVALUATED' },
  { label: 'En signature', value: 'PENDING_SIGNATURE' },
  { label: 'Acceptées',    value: 'ACCEPTED' },
  { label: 'Refusées',     value: 'DECLINED' },
]

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

function statusBadge(status: InscriptionStatus) {
  const map: Record<InscriptionStatus, { label: string; className: string }> = {
    PENDING:           { label: 'En attente',         className: 'bg-slate-100 text-slate-700 border-slate-200' },
    EVALUATED:         { label: 'Évaluée',             className: 'bg-amber-100 text-amber-700 border-amber-200' },
    PENDING_SIGNATURE: { label: 'En attente de signature', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    ACCEPTED:          { label: 'Acceptée',            className: 'bg-green-100 text-green-700 border-green-200' },
    DECLINED:          { label: 'Refusée',             className: 'bg-red-100 text-red-700 border-red-200' },
  }
  const { label, className } = map[status]
  return <Badge variant="outline" className={className}>{label}</Badge>
}

export default function InscriptionsClient({ inscriptions }: InscriptionsClientProps) {
  const [activeTab, setActiveTab]     = useState<InscriptionStatus | 'ALL'>('ALL')
  const [selected, setSelected]       = useState<InscriptionWithFormation | null>(null)
  const [sheetOpen, setSheetOpen]     = useState(false)

  const filtered = activeTab === 'ALL'
    ? inscriptions
    : inscriptions.filter(i => i.status === activeTab)

  function openSheet(inscription: InscriptionWithFormation) {
    setSelected(inscription)
    setSheetOpen(true)
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-0.5 flex-wrap">
        {STATUS_TABS.map(tab => {
          const count    = tab.value === 'ALL'
            ? inscriptions.length
            : inscriptions.filter(i => i.status === tab.value).length
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'relative flex cursor-pointer select-none items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}
            >
              {tab.label}
              {tab.value !== 'ALL' && count > 0 && (
                <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums ring-1 ring-border">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Candidat</TableHead>
              <TableHead className="px-5 text-xs">Email</TableHead>
              <TableHead className="px-5 text-xs">Formation</TableHead>
              <TableHead className="px-5 text-xs">Date</TableHead>
              <TableHead className="px-5 text-xs">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  Aucune demande trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inscription, i) => (
                <TableRow
                  key={inscription.id}
                  className="cursor-pointer"
                  onClick={() => openSheet(inscription)}
                >
                  <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                    {i + 1}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                          {getInitials(inscription.firstName, inscription.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{inscription.firstName} {inscription.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">{inscription.email}</TableCell>
                  <TableCell className="px-5 py-4">{inscription.formation.title}</TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">
                    {format(new Date(inscription.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                  <TableCell className="px-5 py-4">{statusBadge(inscription.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer count */}
        <div className="border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} demande{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>

      {/* Detail sheet */}
      {selected && (
        <InscriptionDetailSheet
          inscription={selected}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </>
  )
}
