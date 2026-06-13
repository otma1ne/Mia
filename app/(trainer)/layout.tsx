import type { ReactNode } from 'react'
import { requireTrainer } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const session = await requireTrainer()

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
