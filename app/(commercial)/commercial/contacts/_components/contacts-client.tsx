'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ContactsResult, ContactRow } from '@/app/actions/commercial'
import type { ContactStatus } from '@prisma/client'
import { deleteContact } from '@/app/actions/commercial'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { MoreHorizontal, Plus, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import CreateContactDialog from './create-contact-dialog'
import EditContactDialog from './edit-contact-dialog'

const STATUS_TABS = [
  { value: undefined,   label: 'Tous' },
  { value: 'PROSPECT',  label: 'Prospect' },
  { value: 'INDECIS',   label: 'Indécis' },
  { value: 'GAGNE',     label: 'Gagné' },
  { value: 'PERDU',     label: 'Perdu' },
] as const

const statusConfig: Record<ContactStatus, { label: string; className: string }> = {
  PROSPECT: { label: 'Prospect', className: 'bg-blue-100 text-blue-700' },
  INDECIS:  { label: 'Indécis',  className: 'bg-amber-100 text-amber-700' },
  GAGNE:    { label: 'Gagné',    className: 'bg-green-100 text-green-700' },
  PERDU:    { label: 'Perdu',    className: 'bg-red-100 text-red-700' },
}

interface Props {
  initialData: ContactsResult
  search: string
  currentStatus: ContactStatus | undefined
  currentPage: number
}

export default function ContactsClient({ initialData, search: initSearch, currentStatus, currentPage }: Props) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(initSearch)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ContactRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ContactRow | null>(null)
  const [isPending, startTransition] = useTransition()

  function navigate(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const p: Record<string, string | undefined> = {
      search: initSearch || undefined,
      status: currentStatus,
      page: '1',
      ...params,
    }
    Object.entries(p).forEach(([k, v]) => { if (v) sp.set(k, v) })
    router.push(`/commercial/contacts?${sp.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ search: searchValue || undefined })
  }

  function handleStatusTab(status: ContactStatus | undefined) {
    navigate({ status, page: '1' })
  }

  function handlePage(page: number) {
    navigate({ page: String(page) })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const result = await deleteContact(deleteTarget.id)
      if (result?.error) return
      setDeleteTarget(null)
      router.refresh()
    })
  }

  const { contacts, total, totalPages } = initialData

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mes contacts</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau contact
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Rechercher par nom, téléphone, ville…"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">Rechercher</Button>
      </form>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.label}
            onClick={() => handleStatusTab(tab.value as ContactStatus | undefined)}
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
                <th className="text-left px-4 py-3 font-medium">Ajouté le</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {contacts.map(contact => {
                const cfg = statusConfig[contact.status]
                return (
                  <tr key={contact.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/commercial/contacts/${contact.id}`} className="hover:underline">
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{contact.city ?? '—'}</td>
                    <td className="px-4 py-3 max-w-[180px] truncate text-muted-foreground">{contact.need}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(contact.createdAt), 'd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/commercial/contacts/${contact.id}`)}>
                            Voir la fiche
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditTarget(contact)}>
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteTarget(contact)}
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => handlePage(currentPage - 1)}>
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => handlePage(currentPage + 1)}>
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateContactDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditContactDialog contact={editTarget} onClose={() => setEditTarget(null)} />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Supprimer ce contact ?</DialogTitle>
            <DialogDescription>
              {deleteTarget && <>
                <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> sera supprimé définitivement.
              </>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={isPending}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
