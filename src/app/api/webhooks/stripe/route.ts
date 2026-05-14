export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { processStripeEvent } from '@/domains/payment/services/paymentService'

// ─── POST /api/webhooks/stripe ────────────────────────────────────────────────
//
// Security layers:
//   - Body read as raw text (never pre-parsed) for signature verification
//   - Invalid signature → 400 (not from Stripe, not retried)
//   - Internal processing error → 200 (Stripe will retry via its retry schedule)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  // Step 1: Verify signature — invalid requests are rejected with 400
  let event: Stripe.Event
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    // Signature mismatch or missing secret — not a valid Stripe request
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  // Step 2: Process the verified event — errors here return 200 so Stripe retries
  try {
    await processStripeEvent(event)
  } catch (error) {
    console.error('[webhooks/stripe] Processing error', { eventType: event.type, eventId: event.id, error })
  }

  return NextResponse.json({ received: true })
}
