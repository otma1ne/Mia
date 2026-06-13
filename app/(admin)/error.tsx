'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error Boundary]', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold text-center">Erreur</h1>
          <p className="text-sm text-muted-foreground text-center">
            Une erreur s'est produite. Veuillez réessayer ou contacter le support.
          </p>
          <div className="w-full space-y-2">
            <Button onClick={reset} className="w-full">
              Réessayer
            </Button>
            <a
              href="/admin/dashboard"
              className="w-full inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              Retour au tableau de bord
            </a>
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
