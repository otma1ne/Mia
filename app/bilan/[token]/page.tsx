import { db } from '@/lib/db'
import BilanForm from './_components/bilan-form'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
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
            <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
              <Image src={logoSrc} alt="MIA Formation" width={22} height={22} className="object-contain" />
            </div>
            <span className="font-bold text-lg">MIA Formation</span>
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
