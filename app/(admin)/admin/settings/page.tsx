import type { Metadata } from 'next'
import { getProfile } from '@/app/actions/profile'
import { redirect } from 'next/navigation'
import ProfileForm from './_components/profile-form'
import PasswordForm from './_components/password-form'

export const metadata: Metadata = { title: 'Paramètres — MIA Formation' }

export default async function SettingsPage() {
  const user = await getProfile()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-3xl">
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  )
}
