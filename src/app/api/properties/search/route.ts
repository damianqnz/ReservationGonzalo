import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PropertyStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { checkAvailability } from '@/lib/services/availabilityService'

// ─── Validation ───────────────────────────────────────────────────────────────

const searchSchema = z.object({
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  guests: z.coerce.number().int().min(1).max(50).optional(),
})

// ─── GET /api/properties/search — public ─────────────────────────────────────

/**
 * Returns ACTIVE properties available for the given dates and guest count.
 * If no dates are provided, returns all ACTIVE properties.
 *
 * Query params:
 *   checkIn  — ISO date string (optional)
 *   checkOut — ISO date string (optional)
 *   guests   — integer (optional)
 */
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams)

  const result = searchSchema.safeParse(params)
  if (!result.success) {
    return NextResponse.json(
      { data: null, error: result.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { checkIn, checkOut, guests } = result.data

  if ((checkIn && !checkOut) || (!checkIn && checkOut)) {
    return NextResponse.json(
      { data: null, error: 'Both checkIn and checkOut are required together.' },
      { status: 400 },
    )
  }

  if (checkIn && checkOut && checkOut <= checkIn) {
    return NextResponse.json(
      { data: null, error: 'checkOut must be after checkIn.' },
      { status: 400 },
    )
  }

  try {
    const properties = await db.property.findMany({
      where: {
        status: PropertyStatus.ACTIVE,
        ...(guests ? { maxGuests: { gte: guests } } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        city: true,
        country: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
        pricePerNight: true,
        cleaningFee: true,
        images: {
          where: { isCover: true },
          select: { url: true, alt: true },
          take: 1,
        },
        amenities: {
          select: {
            amenity: {
              select: { name: true, icon: true },
            },
          },
          take: 4,
        },
        reviews: {
          where: { isPublished: true },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // If dates provided, filter by availability
    let available = properties
    if (checkIn && checkOut) {
      const results = await Promise.all(
        properties.map(async (p) => {
          const isAvailable = await checkAvailability(p.id, checkIn, checkOut)
          return isAvailable ? p : null
        }),
      )
      available = results.filter((p): p is NonNullable<typeof p> => p !== null)
    }

    // Shape response — compute average rating
    const shaped = available.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? Math.round((p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length) * 10) /
            10
          : null

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        city: p.city,
        country: p.country,
        maxGuests: p.maxGuests,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        pricePerNight: p.pricePerNight,
        cleaningFee: p.cleaningFee,
        coverImage: p.images[0] ?? null,
        amenities: p.amenities.map((a) => a.amenity),
        avgRating,
        reviewCount: p.reviews.length,
      }
    })

    return NextResponse.json({ data: { properties: shaped }, error: null })
  } catch (error) {
    console.error('[properties/search/GET]', error)
    return NextResponse.json(
      { data: null, error: 'An unexpected error occurred.' },
      { status: 500 },
    )
  }
}
