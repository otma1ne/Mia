'use client'

import { useEffect, useState, useTransition } from 'react'
import { getFormation, updateFormationStatus, updateFormationDetails } from '@/app/actions/formations'
import RichTextEditor from '@/components/ui/rich-text-editor'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Calendar, Users, BookOpen, ChevronDown, Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FormationStatus, TrainingNiveau } from '@prisma/client'

const NIVEAU_LABELS: Record<TrainingNiveau, string> = {
  START:  'MIA Start',
  PRO:    'MIA Pro',
  EXPERT: 'MIA Expert',
}

type Formation = NonNullable<Awaited<ReturnType<typeof getFormation>>>

const statusConfig: Record<FormationStatus, { label: string; className: string }> = {
  DRAFT:     { label: 'Brouillon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PUBLISHED: { label: 'Publiée',   className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ARCHIVED:  { label: 'Archivée',  className: 'bg-muted text-muted-foreground' },
  COMPLETED: { label: 'Terminée',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
}

const statusOrder: FormationStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'COMPLETED']

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
}

interface FormationDetailSheetProps {
  formationId: string | null
  onClose: () => void
}

export default function FormationDetailSheet({ formationId, onClose }: FormationDetailSheetProps) {
  const [formation, setFormation] = useState<Formation | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUpdating, setIsUpdating] = useState(false)

  // Details edit state
  const [editingDetails, setEditingDetails]   = useState(false)
  const [detailPrice, setDetailPrice]         = useState('')
  const [detailDuration, setDetailDuration]   = useState('')
  const [detailProgramme, setDetailProgramme] = useState('')
  const [detailNiveau, setDetailNiveau]       = useState<TrainingNiveau | ''>('')
  const [detailCodeRS, setDetailCodeRS]       = useState('')
  const [isSavingDetails, startDetailsSave]   = useTransition()

  useEffect(() => {
    if (!formationId) { setFormation(null); return }
    startTransition(async () => {
      const data = await getFormation(formationId)
      setFormation(data ?? null)
      if (data) {
        setDetailPrice(data.price != null ? String(data.price) : '')
        setDetailDuration(data.duration != null ? String(data.duration) : '')
        setDetailProgramme(data.programme ?? '')
        setDetailNiveau((data.niveau ?? '') as TrainingNiveau | '')
        setDetailCodeRS(data.codeRS ?? '')
      }
    })
  }, [formationId])

  async function handleStatusChange(status: FormationStatus) {
    if (!formation) return
    setIsUpdating(true)
    await updateFormationStatus(formation.id, status)
    setFormation(prev => prev ? { ...prev, status } : prev)
    setIsUpdating(false)
  }

  function handleSaveDetails() {
    if (!formation) return
    startDetailsSave(async () => {
      const price    = detailPrice    ? parseFloat(detailPrice)  : null
      const duration = detailDuration ? parseInt(detailDuration) : null
      const programme = detailProgramme.trim() || null
      const niveau   = (detailNiveau || null) as TrainingNiveau | null
      const codeRS   = detailCodeRS.trim() || null
      await updateFormationDetails(formation.id, { price, duration, programme, niveau, codeRS })
      setFormation(prev => prev ? { ...prev, price, duration, programme, niveau, codeRS } : prev)
      setEditingDetails(false)
    })
  }

  return (
    <Sheet open={!!formationId} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto gap-0 p-0">
        {isPending || !formation ? (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">
              {isPending ? 'Chargement…' : 'Formation introuvable.'}
            </span>
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-base leading-snug">{formation.title}</SheetTitle>
                  <SheetDescription className="text-xs mt-1">
                    {formation.category.name} · {formation.type === 'PRESENTIAL' ? 'Présentiel' : 'À distance'}
                  </SheetDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        disabled={isUpdating}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium outline-none disabled:opacity-60"
                      />
                    }
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      formation.status === 'PUBLISHED' ? 'bg-emerald-500' :
                      formation.status === 'DRAFT'     ? 'bg-amber-400'   :
                      formation.status === 'COMPLETED' ? 'bg-blue-500'    :
                      'bg-muted-foreground'
                    }`} />
                    {statusConfig[formation.status].label}
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {statusOrder.filter(s => s !== formation.status).map(s => (
                      <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                        {statusConfig[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                {formation.description}
              </p>
            </SheetHeader>

            <Separator />

            {/* Stats */}
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inscrits</p>
                  <p className="text-sm font-semibold">
                    {formation._count.enrollments} / {formation.maxStudents}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modules</p>
                  <p className="text-sm font-semibold">{formation._count.modules}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Schedule */}
            <div className="p-6 flex flex-col gap-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Calendrier
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Début</span>
                <span className="text-muted-foreground italic">Dates à définir</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fin</span>
                <span className="text-muted-foreground italic">Dates à définir</span>
              </div>
            </div>

            {/* Informations complémentaires */}
            <Separator />
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Informations complémentaires
                </h3>
                {!editingDetails ? (
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setEditingDetails(true)}>
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={handleSaveDetails} disabled={isSavingDetails}>
                    <Check className="h-3 w-3" />
                    {isSavingDetails ? 'Sauvegarde…' : 'Enregistrer'}
                  </Button>
                )}
              </div>
              {editingDetails ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted-foreground">Niveau</label>
                      <Select
                        value={detailNiveau}
                        onValueChange={v => setDetailNiveau(v as TrainingNiveau | '')}
                        labelItems={{ START: 'MIA Start', PRO: 'MIA Pro', EXPERT: 'MIA Expert' }}
                      >
                        <SelectTrigger className="h-8 text-sm w-full">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="START" label="MIA Start">MIA Start</SelectItem>
                          <SelectItem value="PRO" label="MIA Pro">MIA Pro</SelectItem>
                          <SelectItem value="EXPERT" label="MIA Expert">MIA Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted-foreground">Code RS</label>
                      <Input
                        value={detailCodeRS}
                        onChange={e => setDetailCodeRS(e.target.value)}
                        placeholder="RS1234"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted-foreground">Tarif (€)</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detailPrice}
                        onChange={e => setDetailPrice(e.target.value)}
                        placeholder="5000"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted-foreground">Durée (heures)</label>
                      <Input
                        type="number"
                        min="1"
                        value={detailDuration}
                        onChange={e => setDetailDuration(e.target.value)}
                        placeholder="120"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Programme de formation</label>
                    <RichTextEditor
                      value={detailProgramme}
                      onChange={setDetailProgramme}
                      placeholder="Décrivez le contenu détaillé du programme…"
                      minHeight={160}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setEditingDetails(false)}>
                    Annuler
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niveau</span>
                    <span>{formation.niveau ? NIVEAU_LABELS[formation.niveau] : <span className="text-muted-foreground italic">Non renseigné</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code RS</span>
                    <span>{formation.codeRS ?? <span className="text-muted-foreground italic">Non renseigné</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarif</span>
                    <span>{formation.price != null ? `${formation.price.toLocaleString('fr-FR')} €` : <span className="text-muted-foreground italic">Non renseigné</span>}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durée</span>
                    <span>{formation.duration != null ? `${formation.duration} h` : <span className="text-muted-foreground italic">Non renseignée</span>}</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-muted-foreground">Programme</span>
                    {formation.programme ? (
                      <div
                        className="prose-editor text-xs leading-relaxed bg-muted rounded-lg px-3 py-2 line-clamp-5"
                        dangerouslySetInnerHTML={{ __html: formation.programme }}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Non renseigné</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modules list */}
            {formation.modules.length > 0 && (
              <>
                <Separator />
                <div className="p-6 flex flex-col gap-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    Modules inclus ({formation.modules.length})
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {formation.modules.map((module, i) => (
                      <li key={module.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs tabular-nums text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                          <span className="text-sm truncate">{module.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {'—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
