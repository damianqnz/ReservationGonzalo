import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { BookingStatus, PaymentStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import {
  getReservation,
  updateReservation,
} from '@/lib/services/reservationService'

// ─── Validation schemas ───────────────────────────────────────────────────────

const patchSchema = z
  .object({
    status: z.nativeEnum(BookingStatus).optional(),
    ownerNotes: z.string().max(1000).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  })
  .refine((d) => d.status !== undefined || d.ownerNotes !== undefined || d.paymentStatus !== undefined, {
    message: 'At least one field (status, ownerNotes, paymentStatus) must be provided.',
  })

// ─── GET /api/reservations/[id] ───────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const booking = await getReservation(id)

    if (!booking) {
      return NextResponse.json({ data: null, error: 'Reservation not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: booking, error: null }, { status: 200 })
  } catch (error) {
    console.error('[reservations/[id]/GET]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}

// ─── PATCH /api/reservations/[id] ─────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Auth — owner only
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params

  // Validate body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = patchSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const booking = await updateReservation(id, result.data)
    return NextResponse.json({ data: booking, error: null }, { status: 200 })
  } catch (error) {
    console.error('[reservations/[id]/PATCH]', error)

    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes('not found')) {
        return NextResponse.json({ data: null, error: msg }, { status: 404 })
      }
      if (msg.includes('Cannot cancel')) {
        return NextResponse.json({ data: null, error: msg }, { status: 409 })
      }
    }

    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
