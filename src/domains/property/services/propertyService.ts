import { db } from '@/shared/lib/db'
import { deleteImage } from '@/shared/lib/cloudinary-server'
import { getImageUrl } from '@/shared/lib/cloudinary'
import { checkAvailability } from '@/domains/booking/services/availabilityService'
import {
  BookingStatus,
  PropertyStatus,
  PropertyType,
  PricingRuleType,
  ImageCategory,
  RoomType,
  RoomStatus,
} from '@prisma/client'

// ─── Result type ──────────────────────────────────────────────────────────────

type ServiceResult<T> =
  | { data: T; error: null; status?: never }
  | { data: null; error: string; status: number }

// ─── Input interfaces ─────────────────────────────────────────────────────────

export interface CreatePropertyInput {
  title: string
  slug: string
  description: string
  type?: PropertyType
  status?: PropertyStatus
  address: string
  city: string
  country?: string
  zipCode?: string
  maxGuests: number
  bedrooms: number
  bathrooms: number
  beds: number
  area?: number
  pricePerNight: number
  cleaningFee?: number
  securityDeposit?: number
  checkInTime?: string
  checkOutTime?: string
  minNights?: number
  maxNights?: number
  cancellationPolicy?: 'FLEXIBLE' | 'MODERATE' | 'STRICT'
  hasRooms?: boolean
  bedsConfig?: string
  bathroomType?: string
  services?: string
  latitude?: number
  longitude?: number
  arrivalType?: 'autonomous' | 'guided'
  floors?: number
  hasElevator?: boolean
  towelsIncluded?: boolean
  petsAllowed?: boolean
  childrenAllowed?: boolean
  smokingAllowed?: boolean
  spaceDescription?: string
  accessInfo?: string
  interactionInfo?: string
  additionalInfo?: string
  parkingInfo?: string
  extraServices?: string
  houseRules?: string
  cancellationDays?: number
  licenseNumber?: string
  hostDescription?: string
}

export interface UpdatePropertyInput {
  title?: string
  description?: string
  type?: PropertyType
  status?: PropertyStatus
  address?: string
  city?: string
  zipCode?: string
  maxGuests?: number
  bedrooms?: number
  bathrooms?: number
  beds?: number
  area?: number
  pricePerNight?: number
  cleaningFee?: number
  latitude?: number
  longitude?: number
  bedsConfig?: string
  bathroomType?: string
  services?: string
  accessCode?: string | null
  wifiName?: string | null
  wifiPassword?: string | null
  floor?: string | null
  accessInstructions?: string | null
  contactPhone?: string | null
  arrivalType?: 'autonomous' | 'guided'
  floors?: number
  hasElevator?: boolean
  towelsIncluded?: boolean
  petsAllowed?: boolean
  childrenAllowed?: boolean
  smokingAllowed?: boolean
  spaceDescription?: string
  accessInfo?: string
  interactionInfo?: string
  additionalInfo?: string
  parkingInfo?: string
  extraServices?: string
  houseRules?: string
  cancellationDays?: number
  licenseNumber?: string
  hostDescription?: string
}

export interface CreatePropertyImageInput {
  publicId: string
  alt?: string
  order?: number
  isCover?: boolean
  category?: ImageCategory
}

export interface UpdatePropertyImageInput {
  order?: number
  isCover?: boolean
  alt?: string
  category?: ImageCategory
}

export interface SearchFilters {
  checkIn?: Date
  checkOut?: Date
  guests?: number
}

export type CreatePricingData =
  | {
      kind: 'seasonal'
      name: string
      startDate: string
      endDate: string
      pricePerNight: number
      minNights?: number
      roomId?: string
    }
  | {
      kind: 'rule'
      type: PricingRuleType
      value: number
      isPercentage: boolean
      roomId?: string
    }

export type UpdatePricingData =
  | {
      kind: 'seasonal'
      name?: string
      startDate?: string
      endDate?: string
      pricePerNight?: number
      minNights?: number | null
    }
  | {
      kind: 'rule'
      value?: number
      isPercentage?: boolean
    }

export interface CreateRoomInput {
  name: string
  description?: string
  type?: RoomType
  status?: RoomStatus
  maxGuests: number
  bedrooms: number
  bathrooms: number
  bathroomType?: string
  beds: number
  bedsList?: string
  services?: string
  pricePerNight: number
  order?: number
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isPrismaCode(e: unknown, code: string): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    (e as { code: string }).code === code
  )
}

async function verifyPropertyOwnership(
  propertyId: string,
  userId: string,
  userRole: string
): Promise<{ ownerId: string } | null> {
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  })
  return property
}

// ─── listProperties ───────────────────────────────────────────────────────────

/** Returns a paginated list of ACTIVE properties, optionally filtered by ownerId. */
export async function listProperties(page: number, limit: number, ownerId?: string) {
  const skip = (page - 1) * limit
  try {
    const where = {
      status: PropertyStatus.ACTIVE,
      ...(ownerId ? { ownerId } : {}),
    }
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
    return { data: { properties, total, page, limit }, error: null } as const
  } catch (error) {
    console.error('[PropertyService.listProperties]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── createProperty ───────────────────────────────────────────────────────────

/** Creates a new property owned by the given user. */
export async function createProperty(data: CreatePropertyInput, ownerId: string) {
  try {
    const property = await db.property.create({
      data: {
        ...data,
        ownerId,
        cleaningFee: data.cleaningFee ?? 0,
        securityDeposit: data.securityDeposit ?? 0,
        country: data.country ?? 'PT',
        checkInTime: data.checkInTime ?? '15:00',
        checkOutTime: data.checkOutTime ?? '11:00',
        minNights: data.minNights ?? 1,
        maxNights: data.maxNights ?? 365,
        hasRooms: data.hasRooms ?? false,
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
    return { data: property, error: null } as const
  } catch (error) {
    console.error('[PropertyService.createProperty]', error)
    if (isPrismaCode(error, 'P2002')) {
      return { data: null, error: 'Slug already in use.', status: 409 } as const
    }
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── getPropertyById ──────────────────────────────────────────────────────────

/** Returns an ACTIVE property by ID with images and amenities. */
export async function getPropertyById(id: string) {
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
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    return { data: property, error: null } as const
  } catch (error) {
    console.error('[PropertyService.getPropertyById]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── updateProperty ───────────────────────────────────────────────────────────

/** Updates a property after verifying ownership. */
export async function updateProperty(
  id: string,
  data: UpdatePropertyInput,
  userId: string,
  userRole: string
) {
  try {
    const existing = await db.property.findUnique({
      where: { id },
      select: { ownerId: true },
    })
    if (!existing) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (existing.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }
    const updated = await db.property.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        pricePerNight: true,
        updatedAt: true,
      },
    })
    return { data: updated, error: null } as const
  } catch (error) {
    console.error('[PropertyService.updateProperty]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── deleteProperty ───────────────────────────────────────────────────────────

/** Deletes a property after ownership check, booking guard, and Cloudinary cleanup. */
export async function deleteProperty(id: string, userId: string, userRole: string) {
  try {
    const existing = await db.property.findUnique({
      where: { id },
      select: { ownerId: true },
    })
    if (!existing) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (userRole === 'OWNER' && existing.ownerId !== userId) {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    const activeCount = await db.booking.count({
      where: {
        propertyId: id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      },
    })
    if (activeCount > 0) {
      return {
        data: null,
        error: 'Não é possível eliminar uma propriedade com reservas ativas. Cancele as reservas primeiro.',
        status: 409,
      } as const
    }

    const [propertyImages, roomImages] = await Promise.all([
      db.propertyImage.findMany({ where: { propertyId: id }, select: { publicId: true } }),
      db.roomImage.findMany({ where: { room: { propertyId: id } }, select: { publicId: true } }),
    ])
    const publicIds = [
      ...propertyImages.map((i) => i.publicId),
      ...roomImages.map((i) => i.publicId),
    ].filter((pid): pid is string => !!pid && pid.includes('/'))

    await db.property.delete({ where: { id } })

    if (publicIds.length > 0) {
      void Promise.allSettled(publicIds.map((pid) => deleteImage(pid)))
    }

    return { data: { deleted: true } as const, error: null } as const
  } catch (error) {
    console.error('[PropertyService.deleteProperty]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── searchProperties ─────────────────────────────────────────────────────────

/** Returns ACTIVE properties matching date availability and guest count. */
export async function searchProperties(filters: SearchFilters) {
  const { checkIn, checkOut, guests } = filters
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
          select: { amenity: { select: { name: true, icon: true } } },
          take: 4,
        },
        reviews: {
          where: { isPublished: true },
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    let available = properties
    if (checkIn && checkOut) {
      const results = await Promise.all(
        properties.map(async (p) => {
          const isAvailable = await checkAvailability(p.id, checkIn, checkOut)
          return isAvailable ? p : null
        })
      )
      available = results.filter((p): p is NonNullable<typeof p> => p !== null)
    }

    const shaped = available.map((p) => {
      const avgRating =
        p.reviews.length > 0
          ? Math.round(
              (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length) * 10
            ) / 10
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

    return { data: { properties: shaped }, error: null } as const
  } catch (error) {
    console.error('[PropertyService.searchProperties]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── listPropertyImages ───────────────────────────────────────────────────────

/** Returns all images for a property ordered by display order. */
export async function listPropertyImages(propertyId: string) {
  try {
    const images = await db.propertyImage.findMany({
      where: { propertyId },
      orderBy: { order: 'asc' },
    })
    return { data: images, error: null } as const
  } catch (error) {
    console.error('[PropertyService.listPropertyImages]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── createPropertyImage ──────────────────────────────────────────────────────

/** Creates a property image after verifying ownership. Unsets existing cover if isCover. */
export async function createPropertyImage(
  propertyId: string,
  data: CreatePropertyImageInput,
  userId: string,
  userRole: string
) {
  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    if (!property) {
      return { data: null, error: 'Property not found', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden', status: 403 } as const
    }

    if (data.isCover) {
      await db.propertyImage.updateMany({
        where: { propertyId, isCover: true },
        data: { isCover: false },
      })
    }

    const url = getImageUrl(data.publicId)
    const image = await db.propertyImage.create({
      data: {
        propertyId,
        publicId: data.publicId,
        url,
        alt: data.alt ?? null,
        order: data.order ?? 0,
        isCover: data.isCover ?? false,
        ...(data.category && { category: data.category }),
      },
    })
    return { data: image, error: null } as const
  } catch (error) {
    console.error('[PropertyService.createPropertyImage]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── updatePropertyImage ──────────────────────────────────────────────────────

/** Updates a property image after verifying ownership. */
export async function updatePropertyImage(
  propertyId: string,
  imageId: string,
  data: UpdatePropertyImageInput,
  userId: string,
  userRole: string
) {
  try {
    const existing = await db.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: { select: { ownerId: true } } },
    })
    if (!existing || existing.propertyId !== propertyId) {
      return { data: null, error: 'Image not found', status: 404 } as const
    }
    if (existing.property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden', status: 403 } as const
    }

    if (data.isCover) {
      await db.propertyImage.updateMany({
        where: { propertyId, isCover: true, id: { not: imageId } },
        data: { isCover: false },
      })
    }

    const updated = await db.propertyImage.update({
      where: { id: imageId },
      data: {
        ...(data.order    !== undefined && { order:    data.order }),
        ...(data.isCover  !== undefined && { isCover:  data.isCover }),
        ...(data.alt      !== undefined && { alt:      data.alt }),
        ...(data.category !== undefined && { category: data.category }),
      },
    })
    return { data: updated, error: null } as const
  } catch (error) {
    console.error('[PropertyService.updatePropertyImage]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── deletePropertyImage ──────────────────────────────────────────────────────

/** Deletes a property image from DB and Cloudinary after verifying ownership. */
export async function deletePropertyImage(
  propertyId: string,
  imageId: string,
  userId: string,
  userRole: string
) {
  try {
    const existing = await db.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: { select: { ownerId: true } } },
    })
    if (!existing || existing.propertyId !== propertyId) {
      return { data: null, error: 'Image not found', status: 404 } as const
    }
    if (existing.property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden', status: 403 } as const
    }

    if (existing.publicId.includes('/')) {
      await deleteImage(existing.publicId)
    }

    await db.propertyImage.delete({ where: { id: imageId } })
    return { data: { success: true } as const, error: null } as const
  } catch (error) {
    console.error('[PropertyService.deletePropertyImage]', error)
    return { data: null, error: 'Internal server error', status: 500 } as const
  }
}

// ─── listPropertyPricing ──────────────────────────────────────────────────────

/** Returns all seasonal prices, pricing rules, and active rooms for a property. */
export async function listPropertyPricing(
  propertyId: string,
  userId: string,
  userRole: string
) {
  try {
    const property = await verifyPropertyOwnership(propertyId, userId, userRole)
    if (!property) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    const [seasonalPrices, pricingRules, rooms] = await Promise.all([
      db.seasonalPrice.findMany({
        where: { propertyId },
        orderBy: { startDate: 'asc' },
        select: {
          id: true, name: true, startDate: true, endDate: true,
          pricePerNight: true, minNights: true, roomId: true,
        },
      }),
      db.pricingRule.findMany({
        where: { propertyId },
        select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
      }),
      db.room.findMany({
        where: { propertyId, status: 'ACTIVE' },
        orderBy: { order: 'asc' },
        select: { id: true, name: true },
      }),
    ])

    return { data: { seasonalPrices, pricingRules, rooms }, error: null } as const
  } catch (error) {
    console.error('[PropertyService.listPropertyPricing]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── createPricingEntry ───────────────────────────────────────────────────────

/** Creates a seasonal price or pricing rule for a property. */
export async function createPricingEntry(
  propertyId: string,
  data: CreatePricingData,
  userId: string,
  userRole: string
) {
  try {
    const property = await verifyPropertyOwnership(propertyId, userId, userRole)
    if (!property) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    if (data.kind === 'seasonal') {
      const { name, startDate, endDate, pricePerNight, minNights, roomId } = data
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (end <= start) {
        return { data: null, error: 'End date must be after start date.', status: 400 } as const
      }
      const seasonal = await db.seasonalPrice.create({
        data: {
          propertyId,
          roomId: roomId ?? null,
          name,
          startDate: start,
          endDate: end,
          pricePerNight,
          minNights: minNights ?? null,
        },
        select: {
          id: true, name: true, startDate: true, endDate: true,
          pricePerNight: true, minNights: true, roomId: true,
        },
      })
      return { data: seasonal, error: null } as const
    }

    // kind === 'rule' — upsert
    const { type, value, isPercentage, roomId } = data
    const existingRule = await db.pricingRule.findFirst({
      where: { propertyId, type, roomId: roomId ?? null },
      select: { id: true },
    })
    const rule = existingRule
      ? await db.pricingRule.update({
          where: { id: existingRule.id },
          data: { value, isPercentage },
          select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
        })
      : await db.pricingRule.create({
          data: { propertyId, roomId: roomId ?? null, type, value, isPercentage },
          select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
        })
    return { data: rule, error: null } as const
  } catch (error) {
    console.error('[PropertyService.createPricingEntry]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── updatePricingEntry ───────────────────────────────────────────────────────

/** Updates a seasonal price or pricing rule after verifying property ownership. */
export async function updatePricingEntry(
  ruleId: string,
  data: UpdatePricingData,
  propertyId: string,
  userId: string,
  userRole: string
) {
  try {
    const property = await verifyPropertyOwnership(propertyId, userId, userRole)
    if (!property) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    if (data.kind === 'seasonal') {
      const { startDate, endDate, ...rest } = data
      const updated = await db.seasonalPrice.update({
        where: { id: ruleId },
        data: {
          ...rest,
          ...(startDate ? { startDate: new Date(startDate) } : {}),
          ...(endDate ? { endDate: new Date(endDate) } : {}),
        },
        select: {
          id: true, name: true, startDate: true, endDate: true,
          pricePerNight: true, minNights: true, roomId: true,
        },
      })
      return { data: updated, error: null } as const
    }

    // kind === 'rule'
    const { kind: _kind, ...ruleData } = data
    const updated = await db.pricingRule.update({
      where: { id: ruleId },
      data: ruleData,
      select: { id: true, type: true, value: true, isPercentage: true, roomId: true },
    })
    return { data: updated, error: null } as const
  } catch (error) {
    console.error('[PropertyService.updatePricingEntry]', error)
    if (isPrismaCode(error, 'P2025')) {
      return { data: null, error: 'Pricing entry not found.', status: 404 } as const
    }
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── deletePricingEntry ───────────────────────────────────────────────────────

/** Deletes a seasonal price or pricing rule after verifying property ownership. */
export async function deletePricingEntry(
  ruleId: string,
  kind: string | null,
  propertyId: string,
  userId: string,
  userRole: string
) {
  try {
    const property = await verifyPropertyOwnership(propertyId, userId, userRole)
    if (!property) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    if (kind === 'seasonal') {
      await db.seasonalPrice.delete({ where: { id: ruleId } })
    } else {
      await db.pricingRule.delete({ where: { id: ruleId } })
    }
    return { data: { id: ruleId }, error: null } as const
  } catch (error) {
    console.error('[PropertyService.deletePricingEntry]', error)
    if (isPrismaCode(error, 'P2025')) {
      return { data: null, error: 'Pricing entry not found.', status: 404 } as const
    }
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── listRoomsByProperty ──────────────────────────────────────────────────────

/** Returns all rooms for a property after verifying ownership. */
export async function listRoomsByProperty(
  propertyId: string,
  userId: string,
  userRole: string
) {
  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    if (!property) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    const rooms = await db.room.findMany({
      where: { propertyId },
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
    return { data: rooms, error: null } as const
  } catch (error) {
    console.error('[PropertyService.listRoomsByProperty]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}

// ─── createRoom ───────────────────────────────────────────────────────────────

/** Creates a room under a property after verifying ownership. Marks property.hasRooms = true. */
export async function createRoom(
  propertyId: string,
  data: CreateRoomInput,
  userId: string,
  userRole: string
) {
  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    })
    if (!property) {
      return { data: null, error: 'Property not found.', status: 404 } as const
    }
    if (property.ownerId !== userId && userRole !== 'ADMIN') {
      return { data: null, error: 'Forbidden.', status: 403 } as const
    }

    const room = await db.room.create({
      data: {
        ...data,
        propertyId,
        type: data.type ?? RoomType.DOUBLE,
        status: data.status ?? RoomStatus.ACTIVE,
        order: data.order ?? 0,
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

    await db.property.update({
      where: { id: propertyId },
      data: { hasRooms: true },
    })

    return { data: room, error: null } as const
  } catch (error) {
    console.error('[PropertyService.createRoom]', error)
    return { data: null, error: 'An unexpected error occurred.', status: 500 } as const
  }
}
