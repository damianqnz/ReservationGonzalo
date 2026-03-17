export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { handleStripeWebhook } from '@/lib/services/paymentService'

// ─── POST /api/webhooks/stripe ────────────────────────────────────────────────
//
// Stripe sends webhook events here.
// Rules:
//   - Body MUST be read as raw text (never parsed as JSON) for signature verification
//   - ALWAYS return HTTP 200, even on internal errors — Stripe retries on non-2xx
//   - No Zod validation, no auth — signature verification is the security layer

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') ?? ''

  try {
    await handleStripeWebhook(body, signature)
  } catch (error) {
    console.error('[webhooks/stripe]', error)
    // Intentionally return 200 even on error so Stripe does not retry indefinitely
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
