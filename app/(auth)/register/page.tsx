import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import logoSrc from '@/public/logo.png'
import AuthPanel from '../_components/auth-panel'
import RegisterForm from './_components/register-form'
import { db } from '@/lib/db'
import '../_components/auth.css'

export const metadata: Metadata = {
  title: "Demande d'inscription — MIA Digital",
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
              <Image src={logoSrc} alt="MIA Digital" width={60} height={60} className="object-contain" />
            </Link>
            <div>
              <h1 className="auth-heading font-heading mt-1">Demande d&apos;inscription</h1>
              <p className="auth-subtitle text-[15px] mt-2">
                Inscrivez-vous à une formation. Remplissez le formulaire et vous serez contacté sous 24h.
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
