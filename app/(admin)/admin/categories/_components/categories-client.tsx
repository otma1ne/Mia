'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import type { CategoryRow } from '@/app/actions/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { CirclePlus, Pencil, Trash2, Layers } from 'lucide-react'

// ─────────────────────────────────────────
// Create dialog
// ─────────────────────────────────────────

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createCategory, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) { setOpen(false); formRef.current?.reset() }
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <CirclePlus className="h-4 w-4" />
        Ajouter un secteur
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau secteur d&apos;activité</DialogTitle>
          <DialogDescription>
            Les secteurs d&apos;activité permettent de classer les formations et les cours.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">Nom <span className="text-destructive">*</span></Label>
            <Input id="create-name" name="name" placeholder="ex: Développement Web & Mobile" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-desc">Description</Label>
            <Input id="create-desc" name="description" placeholder="Courte description (optionnel)" />
          </div>

          {state && !state.success && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────
// Edit dialog
// ─────────────────────────────────────────

function EditCategoryDialog({ category }: { category: CategoryRow }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateCategory, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) setOpen(false)
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" />
      }>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le secteur d&apos;activité</DialogTitle>
          <DialogDescription>Mettez à jour le nom ou la description.</DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
          <input type="hidden" name="id" value={category.id} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-name-${category.id}`}>Nom <span className="text-destructive">*</span></Label>
            <Input
              id={`edit-name-${category.id}`}
              name="name"
              defaultValue={category.name}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`edit-desc-${category.id}`}>Description</Label>
            <Input
              id={`edit-desc-${category.id}`}
              name="description"
              defaultValue={category.description ?? ''}
              placeholder="Courte description (optionnel)"
            />
          </div>

          {state && !state.success && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────
// Delete dialog
// ─────────────────────────────────────────

function DeleteCategoryDialog({ category }: { category: CategoryRow }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(deleteCategory, null)

  useEffect(() => {
    if (state?.success) setOpen(false)
  }, [state])

  const canDelete = category.formationCount === 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          disabled={!canDelete}
          title={!canDelete ? `${category.formationCount} formation(s) utilisent ce secteur` : 'Supprimer'}
        />
      }>
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>

      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Supprimer le secteur d&apos;activité</DialogTitle>
          <DialogDescription>
            Voulez-vous vraiment supprimer <strong>{category.name}</strong> ?
            Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        {state && !state.success && (
          <p className="text-sm text-destructive px-1">{state.error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <form action={action}>
            <input type="hidden" name="id" value={category.id} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Suppression…' : 'Supprimer'}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────
// Main client
// ─────────────────────────────────────────

interface CategoriesClientProps {
  categories: CategoryRow[]
}

export default function CategoriesClient({ categories }: CategoriesClientProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {categories.length} secteur{categories.length !== 1 ? "s d’activité" : " d’activité"}
        </p>
        <CreateCategoryDialog />
      </div>

      {/* Table */}
      <Card>
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Layers className="h-8 w-8 opacity-40" />
            <p className="text-sm">Aucun secteur d&apos;activité. Commencez par en créer un.</p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5">
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                  )}
                </div>

                {/* Formation count */}
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                  {cat.formationCount} formation{cat.formationCount !== 1 ? 's' : ''}
                </Badge>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <EditCategoryDialog category={cat} />
                  <DeleteCategoryDialog category={cat} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
