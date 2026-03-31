import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PropertyStatus, PropertyType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// ─── Validation schemas ───────────────────────────────────────────────────────

const postSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(10).max(5000),
  type: z.nativeEnum(PropertyType).optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  country: z.string().length(2).optional(),
  zipCode: z.string().max(20).optional(),
  maxGuests: z.number().int().min(1).max(50),
  bedrooms: z.number().int().min(0).max(50),
  bathrooms: z.number().int().min(0).max(50),
  beds: z.number().int().min(1).max(50),
  area: z.number().positive().optional(),
  pricePerNight: z.number().positive(),
  cleaningFee: z.number().min(0).optional(),
  securityDeposit: z.number().min(0).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  minNights: z.number().int().min(1).optional(),
  maxNights: z.number().int().min(1).optional(),
  cancellationPolicy: z.enum(['FLEXIBLE', 'MODERATE', 'STRICT']).optional(),
  hasRooms:     z.boolean().optional(),
  bedsConfig:   z.string().optional(),
  bathroomType: z.string().optional(),
  services:     z.string().optional(),
  latitude:     z.number().optional(),
  longitude:    z.number().optional(),
})

// ─── GET /api/properties — public, returns ACTIVE properties ─────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const skip = (page - 1) * limit
  const ownerId = searchParams.get('ownerId') ?? undefined

  try {
    const where = { status: PropertyStatus.ACTIVE, ...(ownerId ? { ownerId } : {}) }
    const [properties, total] = await db.$transaction([
      db.property.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          city: true,
          country: true,
          maxGuests: true,
          bedrooms: true,
          bathrooms: true,
          pricePerNight: true,
          cleaningFee: true,
          images: {
            where: { isCover: true },
            select: { url: true, publicId: true, alt: true },
            take: 1,
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      db.property.count({ where }),
    ])

    return NextResponse.json({
      data: { properties, total, page, limit },
      error: null,
    })
  } catch (error) {
    console.error('[properties/GET]', error)
    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

// ─── POST /api/properties — owner auth required ───────────────────────────────

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

  const result = postSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  try {
    const property = await db.property.create({
      data: {
        ...result.data,
        ownerId: session.user.id,
        cleaningFee: result.data.cleaningFee ?? 0,
        securityDeposit: result.data.securityDeposit ?? 0,
        country: result.data.country ?? 'PT',
        checkInTime: result.data.checkInTime ?? '15:00',
        checkOutTime: result.data.checkOutTime ?? '11:00',
        minNights: result.data.minNights ?? 1,
        maxNights: result.data.maxNights ?? 365,
        hasRooms: result.data.hasRooms ?? false,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pricePerNight: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: property, error: null }, { status: 201 })
  } catch (error) {
    console.error('[properties/POST]', error)

    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ data: null, error: 'Slug already in use.' }, { status: 409 })
    }

    return NextResponse.json({ data: null, error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
