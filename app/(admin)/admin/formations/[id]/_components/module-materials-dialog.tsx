'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import type { MaterialRow } from '@/app/actions/module-materials'
import type { ModuleRow } from '@/app/actions/modules'
import { getModuleMaterials, addModuleMaterial, deleteModuleMaterial } from '@/app/actions/module-materials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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

interface ModuleMaterialsDialogProps {
  module: ModuleRow | null
  onClose: () => void
}

const initialState = { success: false }

export default function ModuleMaterialsDialog({ module, onClose }: ModuleMaterialsDialogProps) {
  const [materials, setMaterials]   = useState<MaterialRow[]>([])
  const [loading, setLoading]       = useState(false)
  const [addMode, setAddMode]       = useState<'url' | 'file'>('url')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [urlState, urlFormAction, isUrlPending] = useActionState(addModuleMaterial, initialState)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading]       = useState(false)
  const [fileError, setFileError]       = useState<string | null>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!module) return
    setLoading(true)
    getModuleMaterials(module.id).then(data => {
      setMaterials(data)
      setLoading(false)
    })
  }, [module])

  function closeDialog() {
    setAddMode('url')
    setSelectedFile(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
    setFileError(null)
  }

  async function handleFileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedFile || !module) return

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
      saveForm.set('moduleId', module.id)
      saveForm.set('title', title)
      saveForm.set('url', data.url)
      saveForm.set('type', data.type)

      const result = await addModuleMaterial(undefined, saveForm)

      if (result?.error) {
        setFileError(result.error)
      } else {
        closeDialog()
        if (module) {
          getModuleMaterials(module.id).then(setMaterials)
        }
      }
    } catch {
      setFileError('Une erreur inattendue est survenue.')
    } finally {
      setUploading(false)
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    deleteModuleMaterial(id).then(() => {
      setMaterials(prev => prev.filter(m => m.id !== id))
      setDeletingId(null)
    })
  }

  const isBusy = uploading || isUrlPending || loading

  return (
    <Dialog open={!!module} onOpenChange={open => { if (!open) { closeDialog(); onClose() } }}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ressources — {module?.title}</DialogTitle>
          <DialogDescription>Gérez les ressources (vidéos, PDFs, liens) pour ce module</DialogDescription>
        </DialogHeader>

        {module && (
          <div className="space-y-4">
            {/* Materials list */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ressources existantes</p>
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : materials.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">Aucune ressource pour l&apos;instant.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {materials.map(m => (
                    <div key={m.id} className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5">
                      <span className="text-muted-foreground">{typeIcon(m.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingId === m.id}
                        onClick={() => handleDelete(m.id)}
                        className={cn(
                          'cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0',
                          deletingId === m.id && 'opacity-50 pointer-events-none'
                        )}
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add materials section */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ajouter une ressource</p>
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

              {/* URL form */}
              {addMode === 'url' && (
                <form action={urlFormAction} className="space-y-3">
                  <input type="hidden" name="moduleId" value={module.id} />
                  <div>
                    <Label htmlFor="url-title" className="text-sm">Titre</Label>
                    <Input id="url-title" name="title" placeholder="ex. Vidéo introduction" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="url-input" className="text-sm">URL</Label>
                    <Input id="url-input" name="url" type="url" placeholder="https://…" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="url-type" className="text-sm">Type</Label>
                    <Select name="type" defaultValue="link">
                      <SelectTrigger id="url-type" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map(({ value, label }) => (
                          <SelectItem key={value} value={value} label={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {urlState?.error && <p className="text-sm text-destructive">{urlState.error}</p>}
                  <Button type="submit" disabled={isUrlPending} className="w-full">
                    {isUrlPending ? 'Ajout…' : 'Ajouter'}
                  </Button>
                </form>
              )}

              {/* File upload form */}
              {addMode === 'file' && (
                <form onSubmit={handleFileSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="file-title" className="text-sm">Titre</Label>
                    <Input ref={titleInputRef} id="file-title" placeholder="ex. Support de cours" className="mt-1" required />
                  </div>
                  <div>
                    <Label className="text-sm">Fichier</Label>
                    {!selectedFile ? (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 py-6 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors mt-1">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Cliquez pour choisir</span>
                        <input ref={fileInputRef} type="file" accept={ACCEPTED_MIME} onChange={handleFileChange} className="sr-only" />
                      </label>
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2.5 mt-1">
                        <span className="text-muted-foreground">{typeIcon(mimeToMaterialType(selectedFile.type))}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                        </div>
                        <button type="button" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} className="cursor-pointer rounded p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {fileError && <p className="text-sm text-destructive">{fileError}</p>}
                  <Button type="submit" disabled={!selectedFile || uploading} className="w-full">
                    {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Envoi…</> : 'Ajouter'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { closeDialog(); onClose() }}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
