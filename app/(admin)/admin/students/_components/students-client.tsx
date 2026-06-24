'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { StudentsResult } from '@/app/actions/students'
import { deleteStudent } from '@/app/actions/students'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Search,
} from 'lucide-react'
import StudentDetailSheet from './student-detail-sheet'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

interface StudentsClientProps {
  data: StudentsResult
  search: string
}

export default function StudentsClient({ data, search: initialSearch }: StudentsClientProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget]           = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting]               = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === '') next.delete(k)
        else next.set(k, v)
      })
      router.push(`${pathname}?${next.toString()}`)
    },
    [params, pathname, router]
  )

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || null, page: null })
    }, 300)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteStudent(deleteTarget.id)
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  const { students, total, page, pageSize, totalPages } = data

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            defaultValue={initialSearch}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Rechercher des étudiants…"
            className="pl-8"
          />
        </div>
      </div>

      {/* Table card */}
      <Card className="gap-0 py-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 px-5 text-xs">#</TableHead>
              <TableHead className="px-5 text-xs">Étudiant</TableHead>
              <TableHead className="px-5 text-xs">E-mail</TableHead>
              <TableHead className="px-5 text-xs">Téléphone</TableHead>
              <TableHead className="px-5 text-right text-xs">Cours</TableHead>
              <TableHead className="px-5 text-right text-xs">Actifs</TableHead>
              <TableHead className="px-5 text-xs">Inscrit le</TableHead>
              <TableHead className="w-10 px-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                  {initialSearch ? `Aucun étudiant ne correspond à "${initialSearch}".` : 'Aucun étudiant pour l\'instant.'}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student, i) => (
                <TableRow
                  key={student.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <TableCell className="px-5 py-4 text-muted-foreground tabular-nums">
                    {(page - 1) * pageSize + i + 1}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={student.avatar ?? undefined} alt={student.name} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">{student.email}</TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">
                    {student.phone ?? <span className="italic text-muted-foreground/60">—</span>}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right tabular-nums">{student.totalEnrollments}</TableCell>
                  <TableCell className="px-5 py-4 text-right tabular-nums">{student.activeEnrollments}</TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">{formatDate(student.createdAt)}</TableCell>
                  <TableCell
                    className="px-5 py-4"
                    onClick={e => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            aria-label="Actions sur la ligne"
                            className="cursor-pointer rounded p-1 text-muted-foreground outline-none hover:text-foreground"
                          />
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedStudentId(student.id)}>
                          Voir le profil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget({ id: student.id, name: student.name })}
                        >
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {total} étudiant{total !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Lignes par page</span>
              <span className="text-xs font-medium">{pageSize}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: '1' })}
                disabled={page === 1}
                aria-label="Première page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page - 1) })}
                disabled={page === 1}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page === totalPages}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7"
                onClick={() => updateParams({ page: String(totalPages) })}
                disabled={page === totalPages}
                aria-label="Dernière page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Student detail sheet */}
      <StudentDetailSheet
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;étudiant</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer <strong>{deleteTarget?.name}</strong> ? Toutes ses
              inscriptions seront également supprimées. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
