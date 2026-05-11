import { NextRequest, NextResponse } from 'next/server'
import { BookingStatus } from '@prisma/client'
import { auth } from '@/shared/lib/auth'
import {
  getReservation,
  updateReservation,
} from '@/domains/booking/services/reservationService'
import { updateReservationSchema } from '@/domains/booking/validations/bookingSchema'

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
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = updateReservationSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const { action, ...rest } = result.data

    const updateData: Record<string, unknown> = { ...rest }
    if (action === 'checkin') {
      updateData.checkedInAt = new Date()
    } else if (action === 'checkout') {
      updateData.checkedOutAt = new Date()
      updateData.status       = BookingStatus.COMPLETED
    }

    const booking = await updateReservation(id, updateData)
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
