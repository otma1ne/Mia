import type { ReactNode } from 'react'
import { requireCommercial } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function CommercialLayout({ children }: { children: ReactNode }) {
  const session = await requireCommercial()
  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
