import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Candidature reçue — MIA Académie' }

export default function MerciPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center gap-6 max-w-sm">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Candidature reçue !</h1>
          <p className="text-muted-foreground">
            Notre équipe examinera votre dossier et vous contactera sous 48h.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[32px] border border-border bg-transparent px-5 h-9 text-[14px] font-semibold leading-none text-foreground hover:bg-muted transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
