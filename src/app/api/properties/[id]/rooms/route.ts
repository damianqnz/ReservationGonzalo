import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { RoomType, RoomStatus } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

const postSchema = z.object({
  name:          z.string().min(1).max(200),
  description:   z.string().max(2000).optional(),
  type:          z.nativeEnum(RoomType).optional(),
  status:        z.nativeEnum(RoomStatus).optional(),
  maxGuests:     z.number().int().min(1).max(20),
  bedrooms:      z.number().int().min(0).max(20),
  bathrooms:     z.number().int().min(0).max(20),
  bathroomType:  z.string().optional(),
  beds:          z.number().int().min(1).max(20),
  bedsList:      z.string().optional(),
  services:      z.string().optional(),
  pricePerNight: z.number().positive(),
  order:         z.number().int().min(0).optional(),
})

// ─── GET /api/properties/[id]/rooms ──────────────────────────────────────────

export async function GET(
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

  const property = await db.property.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  })

  if (!property) {
    return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
  }
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const rooms = await db.room.findMany({
      where: { propertyId: id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
        beds: true,
        pricePerNight: true,
        order: true,
        createdAt: true,
        images: {
          where: { isCover: true },
          select: { url: true, publicId: true, alt: true },
          take: 1,
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ data: rooms, error: null })
  } catch (error) {
    console.error('[properties/[id]/rooms/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── POST /api/properties/[id]/rooms ─────────────────────────────────────────

export async function POST(
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

  const property = await db.property.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  })

  if (!property) {
    return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
  }
  if (property.ownerId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ data: null, error: 'Invalid JSON body.' }, { status: 400 })
  }

  const result = postSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const room = await db.room.create({
      data: {
        ...result.data,
        propertyId: id,
        type: result.data.type ?? RoomType.DOUBLE,
        status: result.data.status ?? RoomStatus.ACTIVE,
        order: result.data.order ?? 0,
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        pricePerNight: true,
        createdAt: true,
      },
    })

    // Ensure the property is marked as having rooms
    await db.property.update({
      where: { id },
      data: { hasRooms: true },
    })

    return NextResponse.json({ data: room, error: null }, { status: 201 })
  } catch (error) {
    console.error('[properties/[id]/rooms/POST]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
