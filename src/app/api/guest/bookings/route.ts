import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rateLimiter'
import {
  findGuestBookingByCode,
  findGuestBookingsByEmail,
  logGuestAccess,
} from '@/lib/services/guestService'

const querySchema = z
  .object({
    email: z.string().email().optional(),
    code: z.string().min(1).max(32).optional(),
  })
  .refine((d) => d.email || d.code, {
    message: 'email or code is required',
  })

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'

  if (!checkRateLimit(`guest-bookings:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { data: null, error: 'Too many requests' },
      { status: 429 }
    )
  }

  const { searchParams } = req.nextUrl
  const parsed = querySchema.safeParse({
    email: searchParams.get('email') ?? undefined,
    code: searchParams.get('code') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      { data: null, error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, code } = parsed.data

  try {
    if (code) {
      const booking = await findGuestBookingByCode(code)

      if (!booking) {
        // Always return empty array — never reveal if a code exists
        return NextResponse.json({ data: [], error: null })
      }

      await logGuestAccess({
        email: booking.guestEmail,
        confirmationCode: code,
        bookingId: booking.id,
        ipAddress: ip,
      })

      return NextResponse.json({ data: [booking], error: null })
    }

    // Email search — never reveal if the email exists in the system
    const bookings = await findGuestBookingsByEmail(email!)

    if (bookings.length > 0) {
      await Promise.allSettled(
        bookings.map((b) =>
          logGuestAccess({
            email: email!,
            bookingId: b.id,
            ipAddress: ip,
          })
        )
      )
    }

    return NextResponse.json({ data: bookings, error: null })
  } catch (error) {
    console.error('[GET /api/guest/bookings]', error)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
