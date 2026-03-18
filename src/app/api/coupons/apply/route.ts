import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { BookingStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { validateCoupon, applyCoupon } from '@/lib/services/couponService'

// ─── Validation ───────────────────────────────────────────────────────────────

const bodySchema = z.object({
  code: z.string().min(1),
  bookingId: z.string().cuid(),
})

// ─── POST /api/coupons/apply — public ────────────────────────────────────────

/**
 * Applies a validated coupon to a PENDING booking.
 * Also updates the Stripe PaymentIntent amount if one already exists.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = bodySchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { code, bookingId } = result.data

  // Fetch booking — source of truth for email and status
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      status: true,
      guestEmail: true,
      paymentIntentId: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ data: null, error: 'Reserva não encontrada.' }, { status: 404 })
  }

  if (booking.status !== BookingStatus.PENDING) {
    return NextResponse.json(
      { data: null, error: 'Apenas reservas pendentes podem usar cupões.' },
      { status: 409 },
    )
  }

  try {
    // Re-validate to get fresh discount values
    const validation = await validateCoupon(code, bookingId, booking.guestEmail)
    if (!validation.valid) {
      return NextResponse.json({ data: null, error: validation.error }, { status: 400 })
    }

    await applyCoupon(code, bookingId, booking.guestEmail, validation.discount)

    // Update Stripe PaymentIntent amount if it already exists
    if (booking.paymentIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.paymentIntents.update(booking.paymentIntentId, {
          amount: Math.round(validation.finalPrice * 100),
        })
      } catch (stripeErr) {
        // Non-fatal — log but don't fail the request
        console.error('[coupons/apply/POST] Stripe update failed', stripeErr)
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        discount: validation.discount,
        finalPrice: validation.finalPrice,
        description: validation.description,
      },
      error: null,
    })
  } catch (error) {
    console.error('[coupons/apply/POST]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
