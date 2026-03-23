import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createManualBooking } from '@/lib/services/reservationService'
import { createNotification } from '@/lib/services/notificationService'
import { NotificationType } from '@prisma/client'

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = z.object({
  propertyId:      z.string().min(1),
  roomId:          z.string().optional(),
  guestName:       z.string().min(2).max(200),
  guestEmail:      z.string().email(),
  guestPhone:      z.string().max(30).optional(),
  guestCountry:    z.string().max(2).optional(),
  guestCount:      z.number().int().min(1),
  checkIn:         z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid date'),
  checkOut:        z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid date'),
  pricePerNight:   z.number().min(0),
  cleaningFee:     z.number().min(0).default(0),
  securityDeposit: z.number().min(0).default(0),
  paymentStatus:   z.enum(['PAID', 'UNPAID']),
  guestMessage:    z.string().max(1000).optional(),
  ownerNotes:      z.string().max(1000).optional(),
})

// ─── POST /api/reservations/manual ───────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const data = result.data

  try {
    // Verify property ownership for OWNER role
    const property = await db.property.findUnique({
      where:  { id: data.propertyId },
      select: { ownerId: true, title: true },
    })

    if (!property) {
      return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
    }
    if (session.user.role === 'OWNER' && property.ownerId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
    }

    const booking = await createManualBooking({
      ...data,
      checkIn:  new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
    })

    // Fire-and-forget notification
    void createNotification({
      type:    NotificationType.BOOKING_CONFIRMED,
      title:   'Reserva manual criada',
      message: `Reserva manual para ${data.guestName} em ${property.title} (${booking.confirmationCode})`,
      data:    { bookingId: booking.id },
    }).catch((e) => console.error('[reservations/manual/POST notify]', e))

    return NextResponse.json({ data: booking, error: null }, { status: 201 })
  } catch (error) {
    console.error('[reservations/manual/POST]', error)

    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes('disponibilidade')) {
        return NextResponse.json({ data: null, error: msg }, { status: 409 })
      }
      if (msg.includes('check-out')) {
        return NextResponse.json({ data: null, error: msg }, { status: 400 })
      }
    }

    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
