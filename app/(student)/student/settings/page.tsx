import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getProfile } from '@/app/actions/profile'
import ProfileForm from '@/app/(admin)/admin/settings/_components/profile-form'
import PasswordForm from '@/app/(admin)/admin/settings/_components/password-form'

export const metadata: Metadata = { title: 'Paramètres — MIA Formation' }

export default async function StudentSettingsPage() {
  const user = await getProfile()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez les préférences de votre compte.</p>
      </div>
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  )
}
