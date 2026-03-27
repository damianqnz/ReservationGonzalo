import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RoomType, RoomStatus, BookingStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { deleteImage } from '@/lib/cloudinary-server'

// ─── Validation ───────────────────────────────────────────────────────────────

const patchSchema = z
  .object({
    name:          z.string().min(1).max(200).optional(),
    description:   z.string().max(2000).optional(),
    type:          z.nativeEnum(RoomType).optional(),
    status:        z.nativeEnum(RoomStatus).optional(),
    maxGuests:     z.number().int().min(1).max(20).optional(),
    bedrooms:      z.number().int().min(0).max(20).optional(),
    bathrooms:     z.number().int().min(0).max(20).optional(),
    bathroomType:  z.string().optional(),
    beds:          z.number().int().min(1).max(20).optional(),
    bedsList:      z.string().nullish(),
    services:      z.string().nullish(),
    pricePerNight: z.number().positive().optional(),
    order:         z.number().int().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided.' })

// ─── Helper ───────────────────────────────────────────────────────────────────

async function resolveRoom(roomId: string, userId: string, role: string) {
  const room = await db.room.findUnique({
    where: { id: roomId },
    select: { id: true, property: { select: { ownerId: true } } },
  })
  if (!room) return { room: null, forbidden: false }
  const forbidden = role !== 'ADMIN' && room.property.ownerId !== userId
  return { room, forbidden }
}

// ─── PATCH /api/rooms/[roomId] ────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { roomId } = await params

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
    const { room, forbidden } = await resolveRoom(roomId, session.user.id, session.user.role)
    if (!room) {
      return NextResponse.json({ data: null, error: 'Room not found.' }, { status: 404 })
    }
    if (forbidden) {
      return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
    }

    const updated = await db.room.update({
      where: { id: roomId },
      data: result.data,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        pricePerNight: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    console.error('[rooms/[roomId]/PATCH]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── DELETE /api/rooms/[roomId] ───────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { roomId } = await params

  try {
    const { room, forbidden } = await resolveRoom(roomId, session.user.id, session.user.role)
    if (!room) {
      return NextResponse.json({ data: null, error: 'Room not found.' }, { status: 404 })
    }
    if (forbidden) {
      return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
    }

    // Guard: block deletion if active bookings exist
    const activeCount = await db.booking.count({
      where: {
        roomId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
    })

    if (activeCount > 0) {
      return NextResponse.json(
        {
          data: null,
          error:
            'Não é possível eliminar um quarto com reservas ativas. Cancele as reservas primeiro.',
        },
        { status: 409 },
      )
    }

    // Collect Cloudinary publicIds before deletion
    const images = await db.roomImage.findMany({
      where: { roomId },
      select: { publicId: true },
    })

    const publicIds = images
      .map((i) => i.publicId)
      .filter((pid): pid is string => !!pid && pid.includes('/'))

    // Hard delete — DB cascades handle images, blocked dates, pricing, etc.
    await db.room.delete({ where: { id: roomId } })

    // Clean up Cloudinary assets (non-blocking)
    if (publicIds.length > 0) {
      void Promise.allSettled(publicIds.map((pid) => deleteImage(pid)))
    }

    return NextResponse.json({ data: { deleted: true }, error: null })
  } catch (error) {
    console.error('[rooms/[roomId]/DELETE]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
