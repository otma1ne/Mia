import '../../signature.css'
import { db } from '@/lib/db'
import CompanySignatureForm from './_components/company-signature-form'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { AlertCircle } from 'lucide-react'

interface Props {
  params: Promise<{ token: string }>
}

export default async function CompanySignaturePage({ params }: Props) {
  const { token } = await params

  const companyInscription = await db.companyInscription.findUnique({
    where: { signatureToken: token },
    include: {
      company: { select: { prenomSignataire: true, nomSignataire: true, raisonSociale: true } },
      trainingSession: {
        include: { formation: { select: { title: true } } },
      },
    },
  })

  if (!companyInscription) {
    return <ErrorScreen message="Lien invalide ou introuvable. Vérifiez le lien reçu par email." />
  }

  if (companyInscription.status === 'ACCEPTED') {
    return <ErrorScreen message="Cette convention a déjà été signée. Merci pour votre confiance." />
  }

  if (companyInscription.status !== 'PENDING_SIGNATURE') {
    return <ErrorScreen message="Ce lien n'est plus actif. Veuillez contacter notre équipe." />
  }

  if (
    companyInscription.signatureTokenExpiresAt &&
    companyInscription.signatureTokenExpiresAt < new Date()
  ) {
    return (
      <ErrorScreen message="Ce lien a expiré (validité 30 jours). Veuillez contacter notre équipe pour recevoir un nouveau lien." />
    )
  }

  const { company, trainingSession } = companyInscription

  const documents = [
    { label: 'Convention de formation',         url: companyInscription.contratUrl ?? '' },
    { label: 'Règlement intérieur',              url: companyInscription.reglementUrl ?? '' },
    { label: 'Conditions générales de vente',   url: companyInscription.cgvUrl ?? '' },
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
          <span className="ev-hero-badge">Convention de formation</span>
          <h1 className="ev-hero-title font-heading">
            {trainingSession.formation.title}
          </h1>
          <p className="ev-hero-sub">
            Bonjour <strong>{company.prenomSignataire} {company.nomSignataire}</strong>,
            merci de consulter puis signer la convention au nom de{' '}
            <strong>{company.raisonSociale}</strong>.
          </p>
        </div>
      </div>

      <div className="ev-body">
        <div className="ev-card">
          <div className="ev-card-header">
            <p className="ev-card-header-label">Documents contractuels</p>
            <p className="ev-card-header-title">Lecture et signature requises</p>
          </div>
          <CompanySignatureForm token={token} documents={documents} />
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
