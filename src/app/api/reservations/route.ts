import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookingStatus, NotificationType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { createReservation, listReservations } from '@/lib/services/reservationService'
import { createNotification } from '@/lib/services/notificationService'

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

// ─── Validation schemas ───────────────────────────────────────────────────────

const postSchema = z.object({
  propertyId: z.string().cuid({ message: 'Invalid property ID' }),
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  guestCount: z.number().int().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guestMessage: z.string().max(500).optional(),
})

const getQuerySchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ─── POST /api/reservations ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  // Validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { data: null, error: 'Invalid JSON body.' },
      { status: 400 },
    )
  }

  const result = postSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const input = result.data

  if (input.checkOut <= input.checkIn) {
    return NextResponse.json(
      { data: null, error: 'checkOut must be after checkIn.' },
      { status: 400 },
    )
  }

  try {
    const booking = await createReservation(input)

    // Fire notification — non-blocking, failure must not break the response
    createNotification({
      type: NotificationType.NEW_BOOKING,
      title: 'Nova reserva recebida',
      message: `${booking.guestName} reservou para ${booking.checkIn.toLocaleDateString('pt-PT')} – ${booking.checkOut.toLocaleDateString('pt-PT')}.`,
      data: {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
      },
    }).catch((err) => console.error('[reservations/POST] notification failed', err))

    return NextResponse.json({ data: booking, error: null }, { status: 201 })
  } catch (error) {
    console.error('[reservations/POST]', error)

    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes('not available')) {
        return NextResponse.json({ data: null, error: msg }, { status: 409 })
      }
      if (
        msg.includes('not found') ||
        msg.includes('not available for booking') ||
        msg.includes('maximum') ||
        msg.includes('Minimum stay') ||
        msg.includes('Maximum stay')
      ) {
        return NextResponse.json({ data: null, error: msg }, { status: 400 })
      }
    }

    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}

// ─── GET /api/reservations ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Auth — owner only
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  // Validate query params
  const params = Object.fromEntries(req.nextUrl.searchParams)
  const queryResult = getQuerySchema.safeParse(params)
  if (!queryResult.success) {
    return NextResponse.json(
      { data: null, error: queryResult.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { status, page, limit } = queryResult.data

  try {
    const data = await listReservations({ status, page, limit })
    return NextResponse.json({ data, error: null }, { status: 200 })
  } catch (error) {
    console.error('[reservations/GET]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
