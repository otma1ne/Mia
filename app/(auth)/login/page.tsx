import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import AuthPanel from '../_components/auth-panel'
import LoginForm from './_components/login-form'

export const metadata: Metadata = {
  title: 'Connexion — MIA Formation',
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
              <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
                <Image src={logoSrc} alt="MIA Formation" width={22} height={22} className="object-contain" />
              </div>
              <span className="font-bold text-lg tracking-tight">MIA Formation</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bon retour</h1>
              <p className="text-muted-foreground mt-1">Connectez-vous à votre compte pour continuer</p>
            </div>
          </div>

          <LoginForm />

          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} MIA Formation. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right — Visual panel */}
      <AuthPanel />
    </div>
  )
}
