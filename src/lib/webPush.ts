import webpush from 'web-push'
import { db } from '@/lib/db'
import { Role } from '@prisma/client'

// ─── VAPID setup (runs once on module load) ───────────────────────────────────

const vapidPublicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidEmail      = process.env.VAPID_EMAIL

if (vapidPublicKey && vapidPrivateKey && vapidEmail) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string
  body:  string
  url:   string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sends a Web Push notification to a single subscription endpoint.
 *
 * @param endpoint - Subscription endpoint URL
 * @param p256dh   - P-256 DH public key
 * @param auth     - Auth secret
 * @param payload  - Notification payload
 */
export async function sendPushNotification(
  endpoint: string,
  p256dh:   string,
  auth:     string,
  payload:  PushPayload,
) {
  return webpush.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    JSON.stringify(payload),
  )
}

/**
 * Sends a Web Push notification to all active OWNER and ADMIN subscriptions.
 * Invalid/expired subscriptions are deleted automatically.
 * Always uses Promise.allSettled — never blocks the caller.
 *
 * @param payload - Notification payload
 */
export async function sendPushToOwner(payload: PushPayload) {
  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    console.error('[webPush] VAPID keys not configured — skipping push')
    return
  }

  const subscriptions = await db.pushSubscription.findMany({
    where: { user: { role: { in: [Role.OWNER, Role.ADMIN] } } },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await sendPushNotification(sub.endpoint, sub.p256dh, sub.auth, payload)
      } catch (err: unknown) {
        // Remove subscriptions that are gone (410 Gone) or invalid (404)
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await db.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {/* ignore cleanup errors */})
        }
        throw err
      }
    }),
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  if (failed > 0) {
    console.error(`[webPush] ${failed}/${subscriptions.length} push(es) failed`)
  }
}
