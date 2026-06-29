import '../evaluation.css'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { CheckCircle2 } from 'lucide-react'

export default function MerciPage() {
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
        <div className="ev-screen-icon ev-screen-icon-ok">
          <CheckCircle2 size={28} color="#16A34A" />
        </div>
        <h1 className="ev-screen-title">Évaluation soumise !</h1>
        <p className="ev-screen-sub">
          Merci pour vos réponses. L&apos;équipe{' '}
          <strong>MIA Académie</strong> va examiner votre dossier et vous
          contactera prochainement pour la suite de votre candidature.
        </p>
        <Link href="/" className="ev-screen-link">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
