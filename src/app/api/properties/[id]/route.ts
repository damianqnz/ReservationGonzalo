import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PropertyStatus, PropertyType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Validation schemas ───────────────────────────────────────────────────────

const patchSchema = z
  .object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(5000).optional(),
    type: z.nativeEnum(PropertyType).optional(),
    status: z.nativeEnum(PropertyStatus).optional(),
    address: z.string().min(5).max(300).optional(),
    city: z.string().min(2).max(100).optional(),
    zipCode: z.string().max(20).optional(),
    maxGuests: z.number().int().min(1).max(50).optional(),
    bedrooms: z.number().int().min(0).max(50).optional(),
    bathrooms: z.number().int().min(0).max(50).optional(),
    beds: z.number().int().min(1).max(50).optional(),
    area: z.number().positive().optional(),
    pricePerNight: z.number().positive().optional(),
    cleaningFee: z.number().min(0).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    // Access data
    accessCode:          z.string().max(100).nullish(),
    wifiName:            z.string().max(100).nullish(),
    wifiPassword:        z.string().max(100).nullish(),
    floor:               z.string().max(50).nullish(),
    accessInstructions:  z.string().max(2000).nullish(),
    contactPhone:        z.string().max(30).nullish(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field must be provided.' })

// ─── GET /api/properties/[id] — public ───────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const property = await db.property.findUnique({
      where: { id, status: PropertyStatus.ACTIVE },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        status: true,
        address: true,
        city: true,
        country: true,
        zipCode: true,
        latitude: true,
        longitude: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
        beds: true,
        area: true,
        pricePerNight: true,
        cleaningFee: true,
        images: {
          select: { id: true, url: true, alt: true, isCover: true, order: true },
          orderBy: { order: 'asc' },
        },
        amenities: {
          select: { amenity: { select: { name: true, icon: true, category: true } } },
        },
      },
    })

    if (!property) {
      return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: property, error: null })
  } catch (error) {
    console.error('[properties/[id]/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── PATCH /api/properties/[id] — owner auth, verify ownerId ─────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params

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
    // Verify property belongs to this owner
    const existing = await db.property.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!existing) {
      return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
    }

    const updated = await db.property.update({
      where: { id },
      data: result.data,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pricePerNight: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ data: updated, error: null })
  } catch (error) {
    console.error('[properties/[id]/PATCH]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── DELETE /api/properties/[id] — owner auth, soft-archive ──────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ data: null, error: 'Unauthorized.' }, { status: 401 })
  }
  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params

  try {
    const existing = await db.property.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!existing) {
      return NextResponse.json({ data: null, error: 'Property not found.' }, { status: 404 })
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ data: null, error: 'Forbidden.' }, { status: 403 })
    }

    // Soft-delete: archive instead of hard delete to preserve booking history
    await db.property.update({
      where: { id },
      data: { status: PropertyStatus.ARCHIVED },
    })

    return NextResponse.json({ data: { id }, error: null })
  } catch (error) {
    console.error('[properties/[id]/DELETE]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
