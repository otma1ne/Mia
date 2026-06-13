'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CommercialRow } from '@/app/actions/commercial'
import type { ContactStatus } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import CreateCommercialDialog from './create-commercial-dialog'

const STATUS_TABS = [
  { value: undefined,    label: 'Tous' },
  { value: 'NOUVEAU',    label: 'Nouveau' },
  { value: 'CONTACTE',   label: 'Contacté' },
  { value: 'RELANCE',    label: 'Relancé' },
  { value: 'CONVERTI',   label: 'Converti' },
] as const

const statusConfig: Record<ContactStatus, { label: string; className: string }> = {
  NOUVEAU:  { label: 'Nouveau',  className: 'bg-blue-100 text-blue-700' },
  CONTACTE: { label: 'Contacté', className: 'bg-amber-100 text-amber-700' },
  RELANCE:  { label: 'Relancé',  className: 'bg-orange-100 text-orange-700' },
  CONVERTI: { label: 'Converti', className: 'bg-green-100 text-green-700' },
}

interface ContactWithRep {
  id: string
  firstName: string
  lastName: string
  phone: string
  city: string | null
  need: string
  status: ContactStatus
  createdAt: Date
  commercialName: string
}

interface Props {
  initialData: {
    contacts: ContactWithRep[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  commercials: CommercialRow[]
  search: string
  currentStatus: ContactStatus | undefined
  currentPage: number
  currentRepId: string | undefined
}

export default function AdminContactsClient({
  initialData, commercials, search: initSearch, currentStatus, currentPage, currentRepId,
}: Props) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(initSearch)
  const [createCommercialOpen, setCreateCommercialOpen] = useState(false)

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const p: Record<string, string | undefined> = {
      search: initSearch || undefined,
      status: currentStatus,
      repId: currentRepId,
      page: '1',
      ...params,
    }
    Object.entries(p).forEach(([k, v]) => { if (v) sp.set(k, v) })
    router.push(`/admin/commercial?${sp.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search: searchValue || undefined })
  }

  const { contacts, total, totalPages } = initialData

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Commercial</h1>
          <p className="text-sm text-muted-foreground">{total} contact{total > 1 ? 's' : ''} au total</p>
        </div>
        <Button onClick={() => setCreateCommercialOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau commercial
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Rechercher un contact…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="max-w-xs"
          />
          <Button type="submit" variant="outline">Rechercher</Button>
        </form>

        <select
          value={currentRepId ?? ''}
          onChange={e => navigate({ repId: e.target.value || undefined })}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">Tous les commerciaux</option>
          {commercials.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => navigate({ status: tab.value as ContactStatus | undefined })}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentStatus === tab.value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aucun contact trouvé.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Nom</th>
                <th className="text-left px-4 py-3 font-medium">Téléphone</th>
                <th className="text-left px-4 py-3 font-medium">Ville</th>
                <th className="text-left px-4 py-3 font-medium">Besoin</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Commercial</th>
                <th className="text-left px-4 py-3 font-medium">Ajouté le</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map(contact => {
                const cfg = statusConfig[contact.status]
                return (
                  <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{contact.firstName} {contact.lastName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.city ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[160px] truncate text-muted-foreground">{contact.need}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.commercialName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(contact.createdAt), 'd MMM yyyy', { locale: fr })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} contact{total > 1 ? 's' : ''}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => navigate({ page: String(currentPage - 1) })}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => navigate({ page: String(currentPage + 1) })}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      <CreateCommercialDialog open={createCommercialOpen} onClose={() => setCreateCommercialOpen(false)} />
    </div>
  )
}
