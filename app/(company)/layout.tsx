import type { ReactNode } from 'react'
import { requireCompany } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function CompanyLayout({ children }: { children: ReactNode }) {
  const session = await requireCompany()
  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
