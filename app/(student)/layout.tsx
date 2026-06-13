import type { ReactNode } from 'react'
import { requireAuth } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth()

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
