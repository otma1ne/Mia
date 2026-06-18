import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import AuthPanel from '../_components/auth-panel'
import RegisterForm from './_components/register-form'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: "Demande d'inscription — MIA Formation",
}

export default async function RegisterPage() {
  const formations = await db.formation.findMany({
    where:   { status: 'PUBLISHED' },
    select:  { id: true, title: true },
    orderBy: { title: 'asc' },
  })

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <div className="space-y-8">
            <Link href="/" className="flex items-center gap-2 w-fit">
              <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center">
                <Image src={logoSrc} alt="MIA Formation" width={22} height={22} className="object-contain" />
              </div>
              <span className="font-bold text-lg tracking-tight">MIA Formation</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Demande d&apos;inscription</h1>
              <p className="text-muted-foreground mt-1">
                Inscrivez-vous à une formation permis. Remplissez le formulaire et vous serez contacté sous 24h.
              </p>
            </div>
          </div>

          <RegisterForm formations={formations} />
        </div>
      </div>

      {/* Right — Visual panel */}
      <AuthPanel />
    </div>
  )
}
