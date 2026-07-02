import type { ReactNode } from 'react'
import { requireAdmin } from '@/lib/auth'
import DashboardShell from '@/components/layout/dashboard-shell'
import PusherProvider from '@/components/notifications/pusher-provider'
import NotificationBell from '@/components/notifications/notification-bell'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin()

  return (
    <PusherProvider
      pusherKey={process.env.NEXT_PUBLIC_PUSHER_KEY ?? ''}
      pusherCluster={process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? ''}
      beamsInstanceId={process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID}
    >
      <DashboardShell
        user={session.user}
        notifications={<NotificationBell />}
      >
        {children}
      </DashboardShell>
    </PusherProvider>
  )
}
