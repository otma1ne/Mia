import '../signature.css'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import { CheckCircle2 } from 'lucide-react'

export default function SignatureMerciPage() {
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
        <div className="ev-screen-icon ev-screen-icon-ok">
          <CheckCircle2 size={28} color="#16A34A" />
        </div>
        <h1 className="ev-screen-title">Documents signés !</h1>
        <p className="ev-screen-sub">
          Votre inscription est confirmée. Vous allez recevoir un email avec vos
          identifiants de connexion à votre espace{' '}
          <strong>MIA Digital</strong>.
        </p>
        <Link href="/login" className="ev-screen-link">
          Accéder à mon espace
        </Link>
      </div>
    </div>
  )
}
