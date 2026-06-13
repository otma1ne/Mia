import { db } from '@/lib/db'
import { EVALUATION_FIELDS } from '@/lib/evaluation-config'
import EvaluationForm from './_components/evaluation-form'
import Link from 'next/link'
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
            <div className="w-8 h-8 bg-[#1e2128] rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-3.582 9-9 9s-9-2.925-9-9c0-.906.16-1.783.84-2.578L12 14z" />
              </svg>
            </div>
            <span className="font-bold text-lg">EduDrive</span>
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
