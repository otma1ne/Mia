import '../signature.css'
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
    return <ErrorScreen message="Lien invalide ou introuvable. Vérifiez le lien reçu par email." />
  }

  if (sigToken.usedAt) {
    return <ErrorScreen message="Ce lien a déjà été utilisé. Vos documents ont bien été signés." />
  }

  if (sigToken.expiresAt < new Date()) {
    return <ErrorScreen message="Ce lien a expiré (validité 7 jours). Veuillez contacter notre équipe pour recevoir un nouveau lien." />
  }

  const { inscription } = sigToken

  const documents = [
    { label: 'Contrat de formation',          url: inscription.contratUrl ?? '' },
    { label: 'Règlement intérieur',           url: inscription.reglementUrl ?? '' },
    { label: 'Conditions générales de vente', url: inscription.cgvUrl ?? '' },
    { label: 'Programme de formation',        url: inscription.programmeUrl ?? '' },
  ]

  return (
    <div>
      <header className="ev-topbar">
        <div className="ev-topbar-inner">
          <Link href="/" className="ev-topbar-logo">
            <Image src={logoSrc} alt="MIA Académie" width={32} height={32} className="object-contain" />
          </Link>
        </div>
      </header>

      <div className="ev-hero">
        <div className="ev-hero-glow" />
        <div className="ev-hero-fade" />
        <div className="ev-hero-content">
          <span className="ev-hero-badge">Signature de documents</span>
          <h1 className="ev-hero-title font-heading">
            {inscription.formation.title}
          </h1>
          <p className="ev-hero-sub">
            Bonjour <strong>{inscription.firstName}</strong>, merci de consulter puis
            signer vos documents pour finaliser votre inscription.
          </p>
        </div>
      </div>

      <div className="ev-body">
        <div className="ev-card">
          <div className="ev-card-header">
            <p className="ev-card-header-label">Documents contractuels</p>
            <p className="ev-card-header-title">Lecture et signature requises</p>
          </div>
          <SignatureForm token={token} documents={documents} />
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
            <Image src={logoSrc} alt="MIA Académie" width={32} height={32} className="object-contain" />
          </Link>
        </div>
      </header>
      <div className="ev-screen">
        <div className="ev-screen-icon ev-screen-icon-err">
          <AlertCircle size={28} color="#DC2626" />
        </div>
        <h1 className="ev-screen-title">Lien invalide</h1>
        <p className="ev-screen-sub">{message}</p>
        <Link href="/" className="ev-screen-link">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
