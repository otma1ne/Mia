import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin()

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
