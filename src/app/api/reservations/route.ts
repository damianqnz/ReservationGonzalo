import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createReservation,
  listReservations,
} from '@/lib/services/reservationService'
import { BookingStatus } from '@prisma/client'

// ─── Validation schemas ───────────────────────────────────────────────────────

const reservationSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  roomId: z.string().optional(),
  checkIn: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-in date'),
  checkOut: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid check-out date'),
  guestName: z.string().min(2, 'Guest name is required'),
  guestEmail: z.string().email('Invalid guest email'),
  guestPhone: z.string().optional(),
  guestCount: z.number().int().min(1, 'At least 1 guest required'),
  guestMessage: z.string().max(500, 'Message is too long').optional(),
  guestCountry: z.string().min(2).max(2),
  acceptedTerms: z.boolean().refine((v) => v === true, { message: 'Terms must be accepted' }),
  acceptedPrivacy: z.boolean().refine((v) => v === true, { message: 'Privacy policy must be accepted' }),
  acceptedMarketing: z.boolean().default(false),
})

const getQuerySchema = z.object({
  propertyId: z.string().optional(),
  guestEmail: z.string().optional(),
  status: z.nativeEnum(BookingStatus).optional(),
})

// ─── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filters = getQuerySchema.parse(Object.fromEntries(searchParams))

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
    const validated = reservationSchema.parse(body)
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
