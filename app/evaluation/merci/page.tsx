import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function MerciPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
      <h1 className="text-2xl font-bold mb-2">Merci pour votre évaluation !</h1>
      <p className="text-muted-foreground max-w-sm">
        L&apos;équipe <strong>EduDrive</strong> va examiner votre dossier et vous contactera
        prochainement pour vous informer de la suite de votre candidature.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
