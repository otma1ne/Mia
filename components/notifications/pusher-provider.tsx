'use client'

import {
  createContext, useCallback, useContext,
  useEffect, useRef, useState,
} from 'react'
import type { NotificationPayload } from '@/lib/pusher'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────
// Context
// ─────────────────────────────────────────

interface NotificationsContextValue {
  liveQueue: NotificationPayload[]
  drainQueue: () => void
}

const NotificationsContext = createContext<NotificationsContextValue>({
  liveQueue:  [],
  drainQueue: () => {},
})

export function useNotificationsContext() {
  return useContext(NotificationsContext)
}

// ─────────────────────────────────────────
// Toast
// ─────────────────────────────────────────

const TYPE_EMOJI: Record<string, string> = {
  INSCRIPTION_NEW:  '📝',
  DOCUMENT_SIGNED:  '✍️',
  PAYMENT_RECEIVED: '💳',
  SESSION_CHANGED:  '📅',
}

function Toast({
  notif,
  onDismiss,
}: {
  notif: NotificationPayload
  onDismiss: () => void
}) {
  const inner = (
    <div className="flex items-start gap-3">
      <span className="text-xl shrink-0 mt-0.5">{TYPE_EMOJI[notif.type] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{notif.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
          {notif.body}
        </p>
      </div>
      <button
        type="button"
        onClick={e => { e.preventDefault(); e.stopPropagation(); onDismiss() }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )

  return (
    <div className={cn(
      'pointer-events-auto w-80 rounded-xl border bg-background shadow-lg p-4',
      'animate-in slide-in-from-right-4 fade-in duration-300',
    )}>
      {notif.href ? (
        <Link href={notif.href} onClick={onDismiss}>{inner}</Link>
      ) : inner}
    </div>
  )
}

// ─────────────────────────────────────────
// Provider
// ─────────────────────────────────────────

interface PusherProviderProps {
  children:         React.ReactNode
  pusherKey:        string
  pusherCluster:    string
  beamsInstanceId?: string
}

export default function PusherProvider({
  children,
  pusherKey,
  pusherCluster,
  beamsInstanceId,
}: PusherProviderProps) {
  const [liveQueue, setLiveQueue] = useState<NotificationPayload[]>([])
  const [toasts, setToasts]       = useState<(NotificationPayload & { tid: number })[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const drainQueue = useCallback(() => setLiveQueue([]), [])

  const dismiss = useCallback((tid: number) => {
    clearTimeout(timers.current.get(tid))
    timers.current.delete(tid)
    setToasts(prev => prev.filter(t => t.tid !== tid))
  }, [])

  useEffect(() => {
    if (!pusherKey) return

    let pusher: InstanceType<typeof import('pusher-js')['default']>

    import('pusher-js').then(({ default: Pusher }) => {
      pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        channelAuthorization: {
          endpoint:  '/api/pusher/auth',
          transport: 'ajax',
        },
      })

      const channel = pusher.subscribe('private-admin-notifications')

      channel.bind('notification', (data: NotificationPayload) => {
        setLiveQueue(prev => [data, ...prev])

        const tid = Date.now()
        setToasts(prev => [...prev, { ...data, tid }])
        const timer = setTimeout(() => dismiss(tid), 6000)
        timers.current.set(tid, timer)
      })
    })

    // Beams: subscribe to admin-notifications interest for background push
    if (beamsInstanceId && 'serviceWorker' in navigator) {
      import('@pusher/push-notifications-web').then(({ Client }) => {
        const beamsClient = new Client({ instanceId: beamsInstanceId })
        beamsClient
          .start()
          .then(() => beamsClient.addDeviceInterest('admin-notifications'))
          .catch(err => console.warn('[beams]', err))
      }).catch(() => {})
    }

    return () => {
      timers.current.forEach(t => clearTimeout(t))
      timers.current.clear()
      pusher?.disconnect()
    }
  }, [pusherKey, pusherCluster, beamsInstanceId, dismiss])

  return (
    <NotificationsContext.Provider value={{ liveQueue, drainQueue }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.tid} notif={t} onDismiss={() => dismiss(t.tid)} />
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}
