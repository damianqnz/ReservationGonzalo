import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
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

    const message = error instanceof Error ? error.message : 'Internal Server Error'
    console.error('[RESERVATIONS_POST_ERROR]', error)

    return NextResponse.json(
      { data: null, error: message },
      { status: 500 }
    )
  }
}
