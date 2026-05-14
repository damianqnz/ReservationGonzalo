import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/shared/lib/auth'
import { checkRateLimit } from '@/shared/lib/rateLimiter'
import {
  createReservation,
  listReservations,
} from '@/domains/booking/services/reservationService'
import {
  createReservationSchema,
  listReservationsQuerySchema,
} from '@/domains/booking/validations/bookingSchema'

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const filters = listReservationsQuerySchema.parse(Object.fromEntries(searchParams))

    const reservations = await listReservations(filters)

    return NextResponse.json({
      data: reservations,
      error: null,
    })
  } catch (error) {
    console.error('[RESERVATIONS_GET_ERROR]', error)
    return NextResponse.json(
      { data: null, error: 'Failed to fetch reservations.' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!checkRateLimit(`reservations:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const validated = createReservationSchema.parse(body)
    const sessionId = req.cookies.get('rg-session-id')?.value

    const reservation = await createReservation({
      ...validated,
      checkIn: new Date(validated.checkIn),
      checkOut: new Date(validated.checkOut),
      acceptedTerms: validated.acceptedTerms,
      acceptedPrivacy: validated.acceptedPrivacy,
      sessionId,
    })

    return NextResponse.json(
      { data: reservation, error: null },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    console.error('[RESERVATIONS_POST_ERROR]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
