import 'server-only'
import Pusher from 'pusher'
import { db } from '@/lib/db'

export const pusherServer = new Pusher({
  appId:   process.env.PUSHER_APP_ID!,
  key:     process.env.PUSHER_KEY!,
  secret:  process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS:  true,
})

export const ADMIN_CHANNEL = 'private-admin-notifications'

export type NotificationType =
  | 'INSCRIPTION_NEW'
  | 'DOCUMENT_SIGNED'
  | 'PAYMENT_RECEIVED'
  | 'SESSION_CHANGED'
  | 'TRAINER_APPLICATION_NEW'

export type NotifData = {
  firstName?:           string
  lastName?:            string
  formationTitle?:      string
  formationDescription?: string
  inscriptionId?:       string
  sessionTitle?:        string
}

export interface NotificationPayload {
  id:        string
  type:      NotificationType
  title:     string
  body:      string
  href?:     string
  data?:     NotifData
  createdAt: string
}

interface PublishOptions {
  type:  NotificationType
  title: string
  body:  string
  href?: string
  data?: NotifData
}

export async function publishNotification({ type, title, body, href, data }: PublishOptions): Promise<void> {
  // 1. Persist
  const notif = await db.notification.create({
    data: { type: type as any, title, body, href: href ?? null, data: data ?? undefined },
  })

  // 2. Real-time: push to open admin tabs via Pusher Channels
  const payload: NotificationPayload = {
    id:        notif.id,
    type,
    title,
    body,
    href,
    data,
    createdAt: notif.createdAt.toISOString(),
  }

  try {
    await pusherServer.trigger(ADMIN_CHANNEL, 'notification', payload)
  } catch (err) {
    console.error('[pusher:channels]', err)
  }

  // 3. Background push via Pusher Beams (optional — configure PUSHER_BEAMS_* to enable)
  if (process.env.PUSHER_BEAMS_INSTANCE_ID && process.env.PUSHER_BEAMS_SECRET_KEY) {
    try {
      // Dynamic import keeps Beams SDK out of the bundle when not needed
      const { default: PushNotifications } = await import('@pusher/push-notifications-server')
      const beams = new PushNotifications({
        instanceId: process.env.PUSHER_BEAMS_INSTANCE_ID,
        secretKey:  process.env.PUSHER_BEAMS_SECRET_KEY,
      })
      await beams.publishToInterests(['admin-notifications'], {
        web: {
          notification: {
            title,
            body,
            ...(href && {
              deep_link: `${process.env.NEXT_PUBLIC_APP_URL ?? ''}${href}`,
            }),
          },
        },
      })
    } catch (err) {
      console.error('[pusher:beams]', err)
    }
  }
}
