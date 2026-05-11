import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/domains/pricing/services/couponService'
import { db } from '@/shared/lib/db'
import { validateCouponSchema } from '@/domains/pricing/validations/couponSchema'

// ─── Rate limiter (5 req / IP / 10 min) ──────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const WINDOW = 10 * 60 * 1000
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

// ─── POST /api/coupons/validate — public ─────────────────────────────────────

/**
 * Validates a coupon code for a booking without applying it.
 * Looks up the guest email from the booking (never trusted from client).
 */
export async function POST(req: NextRequest) {
  if (isRateLimited(getIp(req))) {
    return NextResponse.json(
      { data: null, error: 'Demasiados pedidos. Tente novamente mais tarde.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = validateCouponSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { code, bookingId } = result.data

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { guestEmail: true },
  })
  if (!booking) {
    return NextResponse.json({ data: null, error: 'Reserva não encontrada.' }, { status: 404 })
  }

  try {
    const validation = await validateCoupon(code, bookingId, booking.guestEmail)
    return NextResponse.json({ data: validation, error: null })
  } catch (error) {
    console.error('[coupons/validate/POST]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
