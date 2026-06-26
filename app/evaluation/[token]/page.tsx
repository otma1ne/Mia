import '../evaluation.css'
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

  if (!evalToken) {
    return <ErrorScreen message="Lien invalide ou introuvable. Vérifiez le lien reçu par email." />
  }

  if (evalToken.usedAt) {
    return <ErrorScreen message="Ce lien a déjà été utilisé. Votre évaluation a bien été soumise." />
  }

  if (evalToken.expiresAt < new Date()) {
    return <ErrorScreen message="Ce lien a expiré (validité 24 h). Veuillez soumettre une nouvelle demande d'inscription." />
  }

  const { inscription } = evalToken

  return (
    <div>
      <header className="ev-topbar">
        <div className="ev-topbar-inner">
          <Link href="/" className="ev-topbar-logo">
            <Image src={logoSrc} alt="MIA Digital" width={32} height={32} className="object-contain" />
          </Link>
        </div>
      </header>

      <div className="ev-hero">
        <div className="ev-hero-glow" />
        <div className="ev-hero-fade" />
        <div className="ev-hero-content">
          <span className="ev-hero-badge">Évaluation de besoins</span>
          <h1 className="ev-hero-title font-heading">
            {inscription.formation.title}
          </h1>
          <p className="ev-hero-sub">
            Bonjour <strong>{inscription.firstName}</strong>, merci de remplir ce
            formulaire avant le début de votre formation. Vos réponses nous permettent
            d&apos;adapter le contenu à vos besoins.
          </p>
        </div>
      </div>

      <div className="ev-body">
        <div className="ev-card">
          <div className="ev-card-header">
            <p className="ev-card-header-label">Formulaire</p>
            <p className="ev-card-header-title">Vos informations et attentes</p>
          </div>
          <EvaluationForm token={token} fields={EVALUATION_FIELDS} />
        </div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div>
      <header className="ev-topbar">
        <div className="ev-topbar-inner">
          <Link href="/" className="ev-topbar-logo">
            <Image src={logoSrc} alt="MIA Digital" width={32} height={32} className="object-contain" />
          </Link>
        </div>
      </header>
      <div className="ev-screen">
        <div className="ev-screen-icon ev-screen-icon-err">
          <AlertCircle size={28} color="#DC2626" />
        </div>
        <h1 className="ev-screen-title">Lien invalide</h1>
        <p className="ev-screen-sub">{message}</p>
        <Link href="/register" className="ev-screen-link">
          Nouvelle demande d&apos;inscription
        </Link>
      </div>
    </div>
  )
}
