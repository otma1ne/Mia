import type { ReactNode } from 'react'
import AppSidebar from './app-sidebar'
import DashboardHeader from './dashboard-header'
import type { UserRole } from '@prisma/client'

interface DashboardShellProps {
  children: ReactNode
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole
  }
  notifications?: ReactNode
}

export default function DashboardShell({ children, user, notifications }: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      {/* Sidebar — desktop */}
      <AppSidebar user={user} />

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header — mobile hamburger + user menu */}
        <DashboardHeader user={user} notifications={notifications} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
