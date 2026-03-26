import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Schemas ──────────────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth:   z.string().min(1),
    }),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
})

// ─── POST /api/push/subscribe ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await req.json()
  const result = subscribeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { endpoint, keys } = result.data.subscription

  try {
    await db.pushSubscription.upsert({
      where:  { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: {
        userId:   session.user.id,
        endpoint,
        p256dh:   keys.p256dh,
        auth:     keys.auth,
      },
    })

    return NextResponse.json({ data: { subscribed: true }, error: null }, { status: 200 })
  } catch (error) {
    console.error('[push/subscribe/POST]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}

// ─── DELETE /api/push/subscribe ───────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }

  const body = await req.json()
  const result = unsubscribeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    await db.pushSubscription.deleteMany({
      where: { endpoint: result.data.endpoint, userId: session.user.id },
    })

    return NextResponse.json({ data: { unsubscribed: true }, error: null }, { status: 200 })
  } catch (error) {
    console.error('[push/subscribe/DELETE]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
