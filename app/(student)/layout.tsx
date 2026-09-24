import type { ReactNode } from 'react'
import { requireStudent } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireStudent()

  return (
    <DashboardShell user={session.user}>
      {children}
    </DashboardShell>
  )
}
