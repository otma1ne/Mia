import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function SignatureMerciPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
      <h1 className="text-2xl font-bold mb-2">Documents signés avec succès !</h1>
      <p className="text-muted-foreground max-w-sm">
        Votre inscription est désormais confirmée. Vous allez recevoir un email avec vos
        identifiants de connexion (ou la confirmation de votre inscription si vous avez déjà
        un compte).
      </p>
      <Link
        href="/login"
        className="mt-8 inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
      >
        Accéder à mon espace
      </Link>
    </div>
  )
}
