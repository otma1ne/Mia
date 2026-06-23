import { db } from '@/lib/db'
import SignatureForm from './_components/signature-form'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function SignaturePage({ params }: Props) {
  const { token } = await params

  const sigToken = await db.signatureToken.findUnique({
    where: { token },
    include: {
      inscription: {
        include: { formation: { select: { title: true } } },
      },
    },
  })

  if (!sigToken) {
    return <ErrorScreen message="Lien invalide ou introuvable." />
  }

  if (sigToken.usedAt) {
    return <ErrorScreen message="Ce lien a déjà été utilisé. Vos documents ont bien été signés." />
  }

  if (sigToken.expiresAt < new Date()) {
    return <ErrorScreen message="Ce lien a expiré (validité 7 jours). Veuillez contacter notre équipe pour recevoir un nouveau lien." />
  }

  const { inscription } = sigToken

  const documents = [
    { label: 'Contrat de formation',           url: inscription.contratUrl ?? '' },
    { label: 'Règlement intérieur',            url: inscription.reglementUrl ?? '' },
    { label: 'Conditions générales de vente',  url: inscription.cgvUrl ?? '' },
    { label: 'Programme de formation',         url: inscription.programmeUrl ?? '' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
              <Image src={logoSrc} alt="MIA Formation" width={22} height={22} className="object-contain" />
            </div>
            <span className="font-bold text-lg">MIA Formation</span>
          </Link>
          <h1 className="text-2xl font-bold">Signature de vos documents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Bonjour <strong>{inscription.firstName}</strong>, merci de consulter et signer vos
            documents pour la formation <strong>{inscription.formation.title}</strong>.
          </p>
        </div>

        <SignatureForm token={token} documents={documents} />
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h1 className="text-xl font-semibold mb-2">Lien invalide</h1>
      <p className="text-muted-foreground max-w-sm">{message}</p>
      <Link href="/" className="mt-6 text-primary text-sm font-medium hover:underline">
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
