import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import AuthPanel from '../_components/auth-panel'
import LoginForm from './_components/login-form'
import '../_components/auth.css'

export const metadata: Metadata = {
  title: 'Connexion — MIA Digital',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Logo + title grouped */}
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <Image src={logoSrc} alt="MIA Digital" width={60} height={60} className="object-contain" />
            </Link>
            <div>
              <h1 className="auth-heading font-heading mt-1">Bon retour</h1>
              <p className="auth-subtitle text-[15px] mt-2">Connectez-vous à votre compte pour continuer</p>
            </div>
          </div>

          <LoginForm />

          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} MIA Digital. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right — Visual panel */}
      <AuthPanel />
    </div>
  )
}
