import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { nightsBetween } from '@/lib/date'
import { resolveImageUrl } from '@/lib/cloudinary'
import PropertyDetailsClient from './PropertyDetailsClient'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const property = await db.property.findUnique({
    where: { slug, status: PropertyStatus.ACTIVE },
    select: { title: true, description: true },
  })
  if (!property) return { title: 'Propriedade não encontrada' }
  return {
    title: property.title,
    description: property.description.slice(0, 160),
  }
}

/**
 * Public property details page.
 * Fetches real data from DB, calculates pricing if dates provided,
 * and delegates rendering to the client component.
 */
export default async function PropertyPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { checkIn: checkInStr, checkOut: checkOutStr, guests: guestsStr } = await searchParams

  const property = await db.property.findUnique({
    where: { slug, status: PropertyStatus.ACTIVE },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      type: true,
      address: true,
      city: true,
      country: true,
      maxGuests: true,
      bedrooms: true,
      bathrooms: true,
      beds: true,
      area: true,
      pricePerNight: true,
      cleaningFee: true,
      securityDeposit: true,
      checkInTime: true,
      checkOutTime: true,
      cancellationPolicy: true,
      minNights: true,
      hasRooms: true,
      rooms: {
        where: { status: "ACTIVE" },
        orderBy: { order: "asc" },
        include: {
          images: {
            orderBy: { order: "asc" },
            select: { url: true, publicId: true, alt: true, order: true, isCover: true },
          },
        },
      },
      images: {
        select: { url: true, publicId: true, alt: true, order: true, isCover: true },
        orderBy: { order: "asc" },
      },
      amenities: {
        select: {
          amenity: { select: { name: true, icon: true } },
        },
      },
      reviews: {
        where: { isPublished: true },
        select: {
          id: true,
          guestName: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      owner: { select: { name: true } },
    },
  });

  if (!property) notFound()

  // ─── Parse search params ────────────────────────────────────────────────────
  let checkIn: Date | undefined
  let checkOut: Date | undefined
  let guests: number | undefined
  let nights: number | undefined
  let totalPrice: number | undefined

  if (checkInStr) {
    const d = new Date(checkInStr)
    if (!isNaN(d.getTime())) checkIn = d
  }
  if (checkOutStr) {
    const d = new Date(checkOutStr)
    if (!isNaN(d.getTime())) checkOut = d
  }
  if (guestsStr) {
    const n = parseInt(guestsStr, 10)
    if (!isNaN(n) && n >= 1) guests = Math.min(n, property.maxGuests)
  }

  if (checkIn && checkOut && checkOut > checkIn) {
    try {
      nights = nightsBetween(checkIn, checkOut)
      // Basic price calculation (long-stay discount handled by pricingService at booking time)
      totalPrice =
        property.pricePerNight * nights + property.cleaningFee + property.securityDeposit
    } catch {
      // invalid range — ignore
    }
  }

  // ─── Aggregate rating ───────────────────────────────────────────────────────
  const avgRating =
    property.reviews.length > 0
      ? Math.round(
          (property.reviews.reduce((sum, r) => sum + r.rating, 0) / property.reviews.length) * 10,
        ) / 10
      : null

  // Resolve Cloudinary URLs server-side (backward compat: Unsplash images use url as-is)
  const resolvedImages = property.images.map((img) => ({
    ...img,
    url: resolveImageUrl(img, { width: 1200 }),
  }))
  const resolvedRooms = property.rooms.map((room) => ({
    ...room,
    images: room.images.map((img) => ({
      ...img,
      url: resolveImageUrl(img, { width: 800 }),
    })),
  }))

  // Serialize Date objects — Next.js passes props as JSON to client components
  const serializedReviews = property.reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <PropertyDetailsClient
      property={{
        ...property,
        images: resolvedImages,
        rooms: resolvedRooms,
        reviews: serializedReviews,
        avgRating,
        reviewCount: property.reviews.length,
      }}
      checkIn={checkIn?.toISOString()}
      checkOut={checkOut?.toISOString()}
      guests={guests}
      nights={nights}
      totalPrice={totalPrice}
    />
  )
}
