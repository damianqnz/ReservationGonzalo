import { z } from 'zod'

// ─── Check-in email ───────────────────────────────────────────────────────────

export const checkinReminderSchema = z.object({
  bookingId: z.string().min(1),
})

// ─── Push notifications ───────────────────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth:   z.string().min(1),
    }),
  }),
})

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
})
