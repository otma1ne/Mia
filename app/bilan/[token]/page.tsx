import { db } from '@/lib/db'
import BilanForm from './_components/bilan-form'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function BilanPage({ params }: Props) {
  const { token } = await params

  const bilan = await db.formationBilan.findUnique({
    where: { token },
    include: {
      enrollment: {
        include: { formation: { select: { title: true } } },
      },
    },
  })

  // Invalid token
  if (!bilan) {
    return <ErrorScreen message="Lien invalide ou introuvable." />
  }

  // Already used
  if (bilan.usedAt) {
    return (
      <ErrorScreen message="Ce bilan a déjà été soumis. Les données ne peuvent pas être modifiées." />
    )
  }

  // Expired
  if (bilan.expiresAt < new Date()) {
    return (
      <ErrorScreen message="Ce lien a expiré (validité 30 jours). Contactez votre centre de formation pour un nouveau lien." />
    )
  }

  const { enrollment } = bilan
  const bilanTitle = bilan.type === 'CHAUD' ? 'Bilan Chaud' : 'Bilan Froid'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#1e2128] rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l9-5-9-5-9 5 9 5z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-3.582 9-9 9s-9-2.925-9-9c0-.906.16-1.783.84-2.578L12 14z"
                />
              </svg>
            </div>
            <span className="font-bold text-lg">EduDrive</span>
          </Link>
          <h1 className="text-2xl font-bold">{bilanTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Formation : <strong>{enrollment.formation.title}</strong>
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {bilan.type === 'CHAUD'
              ? 'Merci de évaluer cette formation. Cela nous aidera à l\'améliorer.'
              : 'Nous aimerions savoir comment vous appliquez vos apprentissages 3 mois après la formation.'}
          </p>
        </div>

        <BilanForm token={token} type={bilan.type as 'CHAUD' | 'FROID'} />
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
      <Link
        href="/"
        className="mt-6 text-primary text-sm font-medium hover:underline"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  )
}
