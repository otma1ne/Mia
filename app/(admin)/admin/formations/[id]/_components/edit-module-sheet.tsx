'use client'

import { useState, useTransition } from 'react'
import { updateModule } from '@/app/actions/modules'
import type { ModuleRow } from '@/app/actions/modules'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface EditModuleSheetProps {
  module: ModuleRow | null
  onClose: () => void
  onUpdated: (partial: Partial<ModuleRow> & { id: string }) => void
}

export default function EditModuleSheet({ module, onClose, onUpdated }: EditModuleSheetProps) {
  const [type, setType] = useState(module?.type ?? 'THEORY')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!module) return
    setError(null)

    const fd = new FormData(e.currentTarget)
    const data = {
      title:       (fd.get('title')       as string).trim(),
      description: (fd.get('description') as string).trim(),
      type:        fd.get('type')         as any,
      duration:    Number(fd.get('duration')) || 0,
    }

    startTransition(async () => {
      const result = await updateModule(module.id, data)
      if (result?.error) {
        setError(result.error)
      } else {
        onUpdated({ id: module.id, ...data })
        onClose()
      }
    })
  }

  return (
    <Sheet open={!!module} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Modifier le module</SheetTitle>
        </SheetHeader>

        {module && (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 px-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="em-title">Titre</Label>
                <Input id="em-title" name="title" defaultValue={module.title} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="em-description">Description</Label>
                <textarea
                  id="em-description"
                  name="description"
                  rows={3}
                  defaultValue={module.description}
                  required
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none dark:bg-input/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select name="type" defaultValue={module.type} onValueChange={(v) => setType(String(v) as 'THEORY' | 'PRACTICAL' | 'ASSESSMENT')} labelItems={{ THEORY: 'Théorie', PRACTICAL: 'Conduite', ASSESSMENT: 'Évaluation' }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="min-w-56">
                    <SelectItem value="THEORY" label="Théorie">Théorie</SelectItem>
                    <SelectItem value="PRACTICAL" label="Conduite">Conduite</SelectItem>
                    <SelectItem value="ASSESSMENT" label="Évaluation">Évaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="em-duration">Durée (minutes)</Label>
                <Input id="em-duration" name="duration" type="number" min={0} defaultValue={module.duration} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <SheetFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
