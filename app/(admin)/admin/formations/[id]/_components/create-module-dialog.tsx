'use client'

import { useActionState, useState } from 'react'
import { createModule } from '@/app/actions/modules'
import type { ModuleRow } from '@/app/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'

interface CreateModuleDialogProps {
  formationId: string
  onCreated: (module: ModuleRow) => void
}

export default function CreateModuleDialog({ formationId, onCreated }: CreateModuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<string>('THEORY')

  const [state, action, isPending] = useActionState(
    async (prev: unknown, formData: FormData) => {
      const result = await createModule(prev, formData)
      if (result?.success) {
        setOpen(false)
        // Refresh is handled by revalidatePath in server action
      }
      return result
    },
    null
  )

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Ajouter un module
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau module</DialogTitle>
          </DialogHeader>

          <form action={action} className="space-y-4">
            <input type="hidden" name="formationId" value={formationId} />

            <div className="space-y-1.5">
              <Label htmlFor="cm-title">Titre</Label>
              <Input id="cm-title" name="title" placeholder="Code de la route" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cm-description">Description</Label>
              <textarea
                id="cm-description"
                name="description"
                rows={3}
                placeholder="Contenu du module…"
                required
                className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select name="type" value={type} onValueChange={(v) => setType(String(v))} labelItems={{ THEORY: 'Théorie (vidéo + ressources)', PRACTICAL: 'Conduite (séances avec formateur)', ASSESSMENT: 'Évaluation finale' }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent className="min-w-96">
                  <SelectItem value="THEORY" label="Théorie (vidéo + ressources)">Théorie (vidéo + ressources)</SelectItem>
                  <SelectItem value="PRACTICAL" label="Conduite (séances avec formateur)">Conduite (séances avec formateur)</SelectItem>
                  <SelectItem value="ASSESSMENT" label="Évaluation finale">Évaluation finale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cm-duration">Durée (minutes)</Label>
              <Input id="cm-duration" name="duration" type="number" min={0} defaultValue={60} />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Création…' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
