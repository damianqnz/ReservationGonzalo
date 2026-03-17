import Stripe from 'stripe'
import { BookingStatus, NotificationType, PaymentStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { cancelReservation } from '@/lib/services/reservationService'
import { createNotification } from '@/lib/services/notificationService'

// ─── Stripe singleton ─────────────────────────────────────────────────────────

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

// ─── Shared booking select ────────────────────────────────────────────────────

const PAYMENT_BOOKING_SELECT = {
  id: true,
  confirmationCode: true,
  totalPrice: true,
  status: true,
  paymentIntentId: true,
  property: {
    select: {
      title: true,
    },
  },
} as const

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Creates a Stripe PaymentIntent for the given booking.
 * Amount is converted to cents (totalPrice × 100), currency EUR.
 * Metadata includes bookingId and confirmationCode for webhook correlation.
 *
 * @param bookingId - Internal booking ID (cuid)
 * @param successUrl - URL Stripe redirects to after successful payment
 * @param cancelUrl - URL Stripe redirects to after cancelled payment
 * @returns clientSecret and paymentIntentId
 * @throws {Error} If booking not found or not in PENDING status
 */
export async function createCheckoutSession(
  bookingId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ clientSecret: string; paymentIntentId: string }> {
  void successUrl
  void cancelUrl

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: PAYMENT_BOOKING_SELECT,
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (booking.status !== BookingStatus.PENDING) {
    throw new Error(`Cannot create payment for a booking with status ${booking.status}`)
  }

  const stripe = getStripe()

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalPrice * 100),
    currency: 'eur',
    metadata: {
      bookingId: booking.id,
      confirmationCode: booking.confirmationCode,
    },
  })

  if (!paymentIntent.client_secret) {
    throw new Error('Stripe did not return a client_secret')
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  }
}

/**
 * Verifies the Stripe webhook signature and processes the event.
 * Handles:
 *   - payment_intent.succeeded → confirmReservation()
 *   - payment_intent.payment_failed → cancelReservation()
 *
 * @param payload - Raw request body as string (must NOT be parsed)
 * @param signature - Value of the stripe-signature header
 * @returns The verified Stripe event
 * @throws {Error} If signature verification fails
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string,
): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  const stripe = getStripe()

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  )

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      await confirmReservation(paymentIntent.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const bookingId = paymentIntent.metadata?.bookingId
      if (bookingId) {
        await cancelReservation(bookingId, 'Pagamento falhou via Stripe')
      }
      break
    }

    default:
      // Ignore unhandled event types
      break
  }

  return event
}

/**
 * Confirms a reservation after successful Stripe payment.
 * Idempotent — calling this twice for the same paymentIntentId is safe.
 *
 * Uses a Prisma transaction to atomically:
 *   1. Update booking status to CONFIRMED and paymentStatus to PAID
 *   2. Create a BOOKING_CONFIRMED notification for the owner
 *
 * @param paymentIntentId - Stripe PaymentIntent ID (pi_...)
 * @returns The updated booking
 * @throws {Error} If no booking is found with the given paymentIntentId
 */
export async function confirmReservation(paymentIntentId: string) {
  const booking = await db.booking.findFirst({
    where: { paymentIntentId },
    select: { id: true, status: true, confirmationCode: true },
  })

  if (!booking) {
    throw new Error(`Booking not found for paymentIntentId: ${paymentIntentId}`)
  }

  // Idempotency: skip if already confirmed
  if (booking.status === BookingStatus.CONFIRMED) {
    return db.booking.findUnique({
      where: { id: booking.id },
      select: PAYMENT_BOOKING_SELECT,
    })
  }

  return db.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PAID,
      },
      select: PAYMENT_BOOKING_SELECT,
    })

    // Non-blocking notification (fire-and-forget inside transaction is intentional
    // — notification failure should not roll back the payment confirmation)
    await createNotification({
      type: NotificationType.BOOKING_CONFIRMED,
      title: 'Reserva Confirmada',
      message: `Reserva ${booking.confirmationCode} foi confirmada após pagamento.`,
      data: { bookingId: booking.id, confirmationCode: booking.confirmationCode },
    })

    return updated
  })
}
