import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// This page exists solely to route users to their role-specific dashboard
// after login/register (both redirect to /dashboard).
export default async function DashboardPage() {
  const session = await auth()

  if (!session) redirect('/login')

  switch (session.user.role) {
    case 'ADMIN':
      redirect('/admin/dashboard')
    case 'TRAINER':
      redirect('/trainer/dashboard')
    default:
      redirect('/student/dashboard')
  }
}
