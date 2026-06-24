'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import type { MaterialRow } from '@/app/actions/module-materials'
import { getModuleMaterials, addModuleMaterial, deleteModuleMaterial } from '@/app/actions/module-materials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { FileText, Video, Link2, Image, Plus, Trash2, Loader2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS = [
  { value: 'pdf',   label: 'PDF',   icon: FileText },
  { value: 'video', label: 'Vidéo', icon: Video },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'link',  label: 'Lien',  icon: Link2 },
]

const ACCEPTED_MIME = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
].join(',')

type AddMode = 'url' | 'file'

function typeIcon(type: string) {
  const found = TYPE_OPTIONS.find(t => t.value === type)
  const Icon = found?.icon ?? Link2
  return <Icon className="h-3.5 w-3.5 shrink-0" />
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function mimeToMaterialType(mime: string) {
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/'))  return 'image'
  if (mime.startsWith('video/'))  return 'video'
  return 'link'
}

interface ModuleMaterialsSectionProps {
  moduleId: string
}

const initialState = { success: false }

export default function ModuleMaterialsSection({ moduleId }: ModuleMaterialsSectionProps) {
  const [materials, setMaterials]   = useState<MaterialRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [addOpen, setAddOpen]       = useState(false)
  const [addMode, setAddMode]       = useState<AddMode>('url')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [, startTransition]         = useTransition()

  const [urlState, urlFormAction, isUrlPending] = useActionState(addModuleMaterial, initialState)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [fileError, setFileError]       = useState<string | null>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    getModuleMaterials(moduleId).then(data => {
      setMaterials(data)
      setLoading(false)
    })
  }, [moduleId])

  useEffect(() => {
    if (urlState.success) {
      closeDialog()
      getModuleMaterials(moduleId).then(setMaterials)
    }
  }, [urlState.success, moduleId])

  function closeDialog() {
    setAddOpen(false)
    setAddMode('url')
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
    setFileError(null)
  }

  function clearFile() {
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile) return

    const title = titleInputRef.current?.value?.trim()
    if (!title) { setFileError('Le titre est requis.'); return }

    setUploading(true)
    setFileError(null)

    try {
      const uploadBody = new FormData()
      uploadBody.set('file', selectedFile)

      const res  = await fetch('/api/upload', { method: 'POST', body: uploadBody })
      const data = await res.json()

      if (!res.ok) { setFileError(data.error ?? 'Erreur lors du téléversement.'); return }

      const saveForm = new FormData()
      saveForm.set('moduleId', moduleId)
      saveForm.set('title', title)
      saveForm.set('url', data.url)
      saveForm.set('type', data.type)

      const result = await addModuleMaterial(undefined, saveForm)

      if (result?.error) {
        setFileError(result.error)
      } else {
        closeDialog()
        getModuleMaterials(moduleId).then(setMaterials)
      }
    } catch {
      setFileError('Une erreur inattendue est survenue.')
    } finally {
      setUploading(false)
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteModuleMaterial(id)
      setMaterials(prev => prev.filter(m => m.id !== id))
      setDeletingId(null)
    })
  }

  const isBusy = uploading || isUrlPending

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ressources</p>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : materials.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Aucune ressource ajoutée pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {materials.map(m => (
            <div key={m.id} className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5">
              <span className="text-muted-foreground">{typeIcon(m.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.title}</p>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors block"
                  onClick={e => e.stopPropagation()}
                >
                  {m.url}
                </a>
              </div>
              <button
                type="button"
                disabled={deletingId === m.id}
                onClick={() => handleDelete(m.id)}
                className={cn(
                  'cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0',
                  deletingId === m.id && 'opacity-50 pointer-events-none'
                )}
                aria-label="Supprimer la ressource"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={open => { if (!open) closeDialog() }}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter une ressource</DialogTitle>
            <DialogDescription>Ajoutez un lien ou téléversez un fichier pour ce module.</DialogDescription>
          </DialogHeader>

          <div className="flex rounded-lg border overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => { setAddMode('url'); setFileError(null) }}
              className={cn(
                'flex-1 py-1.5 font-medium transition-colors',
                addMode === 'url' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Lien URL
            </button>
            <button
              type="button"
              onClick={() => { setAddMode('file'); setFileError(null) }}
              className={cn(
                'flex-1 py-1.5 font-medium transition-colors',
                addMode === 'file' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Téléverser
            </button>
          </div>

          {addMode === 'url' && (
            <form action={urlFormAction} className="flex flex-col gap-4">
              <input type="hidden" name="moduleId" value={moduleId} />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Titre</label>
                <Input name="title" placeholder="ex. Diapositives Semaine 1" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">URL</label>
                <Input name="url" type="url" placeholder="https://…" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Type</label>
                <Select name="type" defaultValue="link" labelItems={Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t.label]))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="min-w-56">
                    {TYPE_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value} label={label}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {urlState.error && <p className="text-sm text-destructive">{urlState.error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Annuler</Button>
                <Button type="submit" disabled={isUrlPending}>
                  {isUrlPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Ajout…</> : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {addMode === 'file' && (
            <form onSubmit={handleFileSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Titre</label>
                <Input ref={titleInputRef} name="title" placeholder="ex. Support de cours PDF" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Fichier</label>
                {!selectedFile ? (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 py-7 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cliquez pour choisir un fichier</span>
                    <input ref={fileInputRef} type="file" accept={ACCEPTED_MIME} onChange={handleFileChange} className="sr-only" />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5">
                    <span className="text-muted-foreground">{typeIcon(mimeToMaterialType(selectedFile.type))}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                    </div>
                    <button type="button" onClick={clearFile} className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {fileError && <p className="text-sm text-destructive">{fileError}</p>}
              {uploading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Téléversement en cours…</div>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isBusy}>Annuler</Button>
                <Button type="submit" disabled={isBusy || !selectedFile}>
                  {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Envoi…</> : 'Téléverser'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
