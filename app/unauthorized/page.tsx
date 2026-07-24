import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Accès refusé — MIA Académie',
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl font-bold mb-4" style={{ color: 'var(--mia-purple)' }}>403</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Accès refusé</h1>
        <p className="mb-8" style={{ color: 'var(--muted-foreground)' }}>
          Vous n&apos;avez pas la permission d&apos;accéder à cette page.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--mia-purple)' }}
          >
            Retour au tableau de bord
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 border rounded-lg font-medium transition-colors hover:bg-muted"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
