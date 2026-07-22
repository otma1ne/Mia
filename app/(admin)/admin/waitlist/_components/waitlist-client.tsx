'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Users } from 'lucide-react'
import type { Waitlist } from '@prisma/client'

interface Props {
  entries: Waitlist[]
}

function getInitials(firstName: string) {
  return firstName.slice(0, 2).toUpperCase()
}

export default function WaitlistClient({ entries }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liste d&apos;attente</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visiteurs inscrits avant l&apos;ouverture de la plateforme
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Users className="h-3.5 w-3.5" />
          {entries.length} inscrit{entries.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Aucun inscrit pour l&apos;instant.
                </TableCell>
              </TableRow>
            ) : (
              entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-[var(--mia-purple-tint)] text-[var(--mia-purple)]">
                          {getInitials(entry.firstName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{entry.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.phone ?? <span className="text-muted-foreground/50">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(entry.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
