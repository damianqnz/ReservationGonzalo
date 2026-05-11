import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/shared/lib/rateLimiter'
import {
  findGuestBookingById,
  logGuestAccess,
} from '@/domains/booking/services/guestService'
import { guestBookingByIdSchema } from '@/domains/booking/validations/bookingSchema'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (!checkRateLimit(`guest-booking-detail:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests' },
      { status: 429 }
    )
  }

  const { id } = await params

  const parsed = guestBookingByIdSchema.safeParse({
    code: req.nextUrl.searchParams.get('code') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: 'code param is required' },
      { status: 400 }
    )
  }

  try {
    const booking = await findGuestBookingById(id)

    if (!booking) {
      return NextResponse.json(
        { data: null, error: 'Not found' },
        { status: 404 }
      )
    }

    if (booking.confirmationCode !== parsed.data.code) {
      return NextResponse.json(
        { data: null, error: 'Forbidden' },
        { status: 403 }
      )
    }

    await logGuestAccess({
      email: booking.guestEmail,
      confirmationCode: booking.confirmationCode,
      bookingId: booking.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: booking, error: null })
  } catch (error) {
    console.error('[GET /api/guest/bookings/[id]]', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
