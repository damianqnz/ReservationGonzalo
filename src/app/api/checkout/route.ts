import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/shared/lib/db'
import { createCheckoutSession } from '@/domains/payment/services/paymentService'
import { createCheckoutSchema } from '@/domains/booking/validations/bookingSchema'

// ─── Rate limiter (3 req / IP / 10 min) ──────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true
  }

  entry.count++
  return false
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

// ─── POST /api/checkout ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = createCheckoutSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { bookingId, successUrl, cancelUrl } = result.data

  try {
    const { clientSecret, paymentIntentId } = await createCheckoutSession(
      bookingId,
      successUrl,
      cancelUrl,
    )

    await db.booking.update({
      where: { id: bookingId },
      data: { paymentIntentId },
    })

    return NextResponse.json({ data: { clientSecret, paymentIntentId }, error: null })
  } catch (error) {
    console.error('[POST /api/checkout]', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (
      message.includes('not found') ||
      message.includes('Cannot create payment')
    ) {
      return NextResponse.json({ data: null, error: message }, { status: 400 })
    }

    return NextResponse.json(
      { data: null, error: 'Failed to create payment session.' },
      { status: 500 },
    )
  }
}
