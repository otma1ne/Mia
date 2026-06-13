import type { Metadata } from 'next'
import Link from 'next/link'
import AuthPanel from '../_components/auth-panel'
import LoginForm from './_components/login-form'

export const metadata: Metadata = {
  title: 'Connexion — EduDrive',
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
              <div className="w-8 h-8 bg-[#1e2128] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422A12.083 12.083 0 0121 13c0 6.075-3.582 9-9 9s-9-2.925-9-9c0-.906.16-1.783.84-2.578L12 14z" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">EduDrive</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bon retour</h1>
              <p className="text-muted-foreground mt-1">Connectez-vous à votre compte pour continuer</p>
            </div>
          </div>

          <LoginForm />

          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} EduDrive. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right — Visual panel */}
      <AuthPanel />
    </div>
  )
}
