import { db } from '@/lib/db'
import { EVALUATION_FIELDS } from '@/lib/evaluation-config'
import EvaluationForm from './_components/evaluation-form'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function EvaluationPage({ params }: Props) {
  const { token } = await params

  const evalToken = await db.evaluationToken.findUnique({
    where: { token },
    include: {
      inscription: {
        include: { formation: { select: { title: true } } },
      },
    },
  })

  // Invalid token
  if (!evalToken) {
    return <ErrorScreen message="Lien invalide ou introuvable." />
  }

  // Already used
  if (evalToken.usedAt) {
    return <ErrorScreen message="Ce lien a déjà été utilisé. L'évaluation a bien été soumise." />
  }

  // Expired
  if (evalToken.expiresAt < new Date()) {
    return <ErrorScreen message="Ce lien a expiré (validité 24h). Veuillez soumettre une nouvelle demande d'inscription." />
  }

  const { inscription } = evalToken

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
              <Image src={logoSrc} alt="MIA Formation" width={22} height={22} className="object-contain" />
            </div>
            <span className="font-bold text-lg">MIA Formation</span>
          </Link>
          <h1 className="text-2xl font-bold">Évaluation de besoins</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Bonjour <strong>{inscription.firstName}</strong>, merci de remplir ce formulaire pour la formation{' '}
            <strong>{inscription.formation.title}</strong>.
          </p>
        </div>

        <EvaluationForm token={token} fields={EVALUATION_FIELDS} />
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
      <Link href="/register" className="mt-6 text-primary text-sm font-medium hover:underline">
        Nouvelle demande d&apos;inscription
      </Link>
    </div>
  )
}
