'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Building2, Search } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import NewCompanyDialog from './new-company-dialog'

type CompanyRow = {
  id:               string
  raisonSociale:    string
  nomSignataire:    string
  prenomSignataire: string
  email:            string
  phone:            string
  createdAt:        Date
  _count: { employees: number; inscriptions: number }
}

interface CompaniesClientProps {
  companies: CompanyRow[]
}

export default function CompaniesClient({ companies }: CompaniesClientProps) {
  const [search, setSearch] = useState('')

  const filtered = companies.filter(c =>
    c.raisonSociale.toLowerCase().includes(search.toLowerCase()) ||
    `${c.prenomSignataire} ${c.nomSignataire}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une entreprise…"
            className="pl-9"
          />
        </div>
        <NewCompanyDialog />
      </div>

      {/* Table */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-5 text-xs">Entreprise</TableHead>
              <TableHead className="px-5 text-xs">Signataire</TableHead>
              <TableHead className="px-5 text-xs">Contact</TableHead>
              <TableHead className="px-5 text-xs">Salariés</TableHead>
              <TableHead className="px-5 text-xs">Inscriptions</TableHead>
              <TableHead className="px-5 text-xs">Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {search ? 'Aucune entreprise trouvée.' : 'Aucune entreprise enregistrée.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(company => (
                <TableRow key={company.id} className="cursor-pointer">
                  <TableCell className="px-5 py-4">
                    <Link href={`/admin/entreprises/${company.id}`} className="flex items-center gap-3 hover:no-underline">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                        <Building2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium hover:underline">{company.raisonSociale}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">
                    {company.prenomSignataire} {company.nomSignataire}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm">{company.email}</span>
                      <span className="text-xs text-muted-foreground">{company.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge variant="outline" className="bg-slate-50 text-slate-700">
                      {company._count.employees}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {company._count.inscriptions}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground text-sm">
                    {format(new Date(company.createdAt), 'dd MMM yyyy', { locale: fr })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} entreprise{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      </Card>
    </>
  )
}
