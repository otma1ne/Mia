'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { createSkill, deleteSkill } from '@/app/actions/skills'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { BrainCircuit, CirclePlus, Trash2 } from 'lucide-react'

interface Skill {
  id: string
  name: string
}

interface SkillsManagerProps {
  initialSkills: Skill[]
}

export default function SkillsManager({ initialSkills }: SkillsManagerProps) {
  const [skills, setSkills]               = useState<Skill[]>(initialSkills)
  const [addOpen, setAddOpen]             = useState(false)
  const [deleteTarget, setDeleteTarget]   = useState<Skill | null>(null)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [state, action, pending]          = useActionState(createSkill, null)
  const formRef                           = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      setAddOpen(false)
      formRef.current?.reset()
    }
  }, [state])

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    await deleteSkill(deleteTarget.id)
    setSkills(prev => prev.filter(s => s.id !== deleteTarget.id))
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <Card className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 shrink-0">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Compétences intervenants</h2>
              <p className="text-xs text-muted-foreground">Liste des compétences proposées dans le formulaire candidature</p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <CirclePlus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {skills.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 flex flex-col items-center gap-2 text-center">
            <BrainCircuit className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aucune compétence ajoutée.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <div
                key={skill.id}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm group"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(skill)}
                  className="shrink-0 rounded-full p-0.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  aria-label={`Supprimer ${skill.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter une compétence</DialogTitle>
            <DialogDescription>Cette compétence sera proposée dans le formulaire de candidature intervenant.</DialogDescription>
          </DialogHeader>
          <form ref={formRef} action={action} className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="skillName">Nom de la compétence</Label>
              <Input id="skillName" name="name" placeholder="Ex: Python, React, Excel…" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={pending}>{pending ? 'Ajout…' : 'Ajouter'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la compétence</DialogTitle>
            <DialogDescription>
              Supprimer <strong>{deleteTarget?.name}</strong> ? Les candidatures existantes conserveront cette compétence dans leurs données.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
