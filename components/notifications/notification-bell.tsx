'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, GraduationCap, Calendar } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  getNotifications, markAllNotificationsRead, markNotificationRead,
} from '@/app/actions/notifications'
import { useNotificationsContext } from './pusher-provider'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import type { NotifData, NotificationType } from '@/lib/pusher'

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

type NotifRow = {
  id:        string
  type:      string
  title:     string
  body:      string
  href:      string | null
  data:      NotifData | null
  read:      boolean
  createdAt: Date
}

// ─────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
]

function getAvatarColor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

function Avatar({ firstName, lastName }: { firstName?: string; lastName?: string }) {
  if (!firstName) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
    )
  }
  const initials = `${firstName[0]}${lastName?.[0] ?? ''}`.toUpperCase()
  const colorClass = getAvatarColor(firstName)
  return (
    <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold', colorClass)}>
      {initials}
    </div>
  )
}

// ─────────────────────────────────────────
// Notification item
// ─────────────────────────────────────────

function NotifItem({
  n,
  onRead,
  onClose,
}: {
  n: NotifRow
  onRead: (id: string) => void
  onClose: () => void
}) {
  const data = n.data
  const type = n.type as NotificationType

  const nameNode = data?.firstName ? (
    <span className="font-semibold">{data.firstName} {data.lastName}</span>
  ) : null

  // For SESSION_CHANGED, bold the session title
  const subjectNode = type === 'SESSION_CHANGED' && data?.sessionTitle ? (
    <span className="font-semibold">« {data.sessionTitle} »</span>
  ) : null

  const handleRead = () => { if (!n.read) onRead(n.id) }

  return (
    <div
      className={cn(
        'px-4 py-3.5 transition-colors',
        !n.read && 'bg-violet-50/60',
      )}
      onClick={handleRead}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar firstName={data?.firstName} lastName={data?.lastName} />

        <div className="flex-1 min-w-0">
          {/* Main text */}
          <p className="text-sm leading-snug">
            {nameNode && <>{nameNode}{' '}</>}
            {subjectNode && <>{subjectNode}{' '}</>}
            <span className="text-foreground/80">{n.body}</span>
          </p>

          {/* Formation card — INSCRIPTION_NEW / DOCUMENT_SIGNED */}
          {(type === 'INSCRIPTION_NEW' || type === 'DOCUMENT_SIGNED') && data?.formationTitle && (
            <div className="mt-2 rounded-xl border bg-background p-2.5 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-violet-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">{data.formationTitle}</p>
                {data.formationDescription && (
                  <p className="text-[11px] text-muted-foreground leading-tight line-clamp-1 mt-0.5">
                    {data.formationDescription}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Session icon row — SESSION_CHANGED */}
          {type === 'SESSION_CHANGED' && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{n.title}</span>
            </div>
          )}

          {/* Action buttons — INSCRIPTION_NEW only */}
          {type === 'INSCRIPTION_NEW' && n.href && (
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={n.href}
                onClick={() => { handleRead(); onClose() }}
                className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition-colors"
              >
                Examiner la demande
              </Link>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); handleRead() }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Plus tard
              </button>
            </div>
          )}

          {/* Time */}
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            {formatDistanceToNow(n.createdAt, { locale: fr, addSuffix: true })}
          </p>
        </div>

        {/* Unread dot */}
        {!n.read && (
          <span className="h-2 w-2 rounded-full bg-violet-600 shrink-0 mt-1.5 ml-1" />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────
// Bell
// ─────────────────────────────────────────

export default function NotificationBell() {
  const [open, setOpen]             = useState(false)
  const [notifications, setNotifs]  = useState<NotifRow[]>([])
  const { liveQueue, drainQueue }   = useNotificationsContext()

  const load = useCallback(async () => {
    const rows = await getNotifications(30)
    setNotifs(rows as unknown as NotifRow[])
  }, [])

  useEffect(() => { load() }, [load])

  // Merge live notifications (de-duped)
  useEffect(() => {
    if (liveQueue.length === 0) return
    setNotifs(prev => {
      const ids = new Set(prev.map(n => n.id))
      const fresh = liveQueue
        .filter(n => !ids.has(n.id))
        .map(n => ({
          id:        n.id,
          type:      n.type,
          title:     n.title,
          body:      n.body,
          href:      n.href ?? null,
          data:      (n.data ?? null) as NotifData | null,
          read:      false,
          createdAt: new Date(n.createdAt),
        }))
      return [...fresh, ...prev]
    })
    drainQueue()
  }, [liveQueue, drainQueue])

  const unread = notifications.filter(n => !n.read).length

  function handleRead(id: string) {
    markNotificationRead(id).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function handleMarkAllRead() {
    markAllNotificationsRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center',
            'rounded-full bg-violet-600 text-[10px] font-bold text-white',
          )}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[340px] p-0 overflow-hidden shadow-lg"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-foreground/70" />
            <p className="text-sm font-semibold">Notifications</p>
          </div>
          {unread > 0 ? (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors"
            >
              {unread} nouvelles
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">À jour</span>
          )}
        </div>

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Bell className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Aucune notification</p>
              <p className="text-xs text-muted-foreground/60">Vous êtes à jour ✓</p>
            </div>
          ) : (
            notifications.map(n => (
              <NotifItem
                key={n.id}
                n={n}
                onRead={handleRead}
                onClose={() => setOpen(false)}
              />
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
