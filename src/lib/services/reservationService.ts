import { db } from '@/lib/db'
import { BookingStatus, PropertyStatus, NotificationType } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'
import { checkAvailability, checkRoomAvailability } from './availabilityService'
import { calculateTotalPrice } from './pricingService'

// ─── Constants ───────────────────────────────────────────────────────────────

const PENDING_EXPIRY_MINUTES = 30

const BOOKING_SELECT = {
  id: true,
  confirmationCode: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  guestName: true,
  guestEmail: true,
  guestCount: true,
  totalPrice: true,
  currency: true,
  status: true,
  property: {
    select: {
      id: true,
      title: true,
      slug: true,
      address: true,
      city: true,
      country: true,
      checkInTime: true,
      checkOutTime: true,
      cancellationPolicy: true,
      images: {
        where: { isCover: true },
        select: { url: true, alt: true },
        take: 1,
      },
    },
  },
  room: {
    select: {
      id: true,
      name: true,
      type: true,
    },
  },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDate(d: Date): Date {
  const normalized = new Date(d)
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized
}

function nightsBetween(start: Date, end: Date): number {
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function generateConfirmationCode(): string {
  // Simple alphanumeric 6-char code
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateReservationInput {
  propertyId: string
  roomId?: string
  checkIn: Date
  checkOut: Date
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number
  guestMessage?: string
  guestCountry?: string
  acceptedTerms?: boolean
  acceptedPrivacy?: boolean
  acceptedMarketing?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Creates a new reservation with PENDING status.
 * Performs availability check, price calculation and validation.
 */
export async function createReservation(input: CreateReservationInput) {
  const checkIn = normalizeDate(input.checkIn)
  const checkOut = normalizeDate(input.checkOut)
  const nights = nightsBetween(checkIn, checkOut)

  if (nights <= 0) {
    throw new Error('Check-out must be after check-in')
  }

  // Fetch property constraints
  const property = await db.property.findUnique({
    where: { id: input.propertyId },
    select: {
      status: true,
      maxGuests: true,
      minNights: true,
      maxNights: true,
      cleaningFee: true,
      securityDeposit: true,
      currency: true,
    },
  })

  if (!property) {
    throw new Error('Property not found')
  }

  const room = input.roomId
    ? await db.room.findFirst({ where: { id: input.roomId, propertyId: input.propertyId }, select: { id: true, maxGuests: true, type: true } })
    : null

  if (input.roomId && !room) {
    throw new Error('Room not found in this property')
  }

  if (property.status !== PropertyStatus.ACTIVE) {
    throw new Error('Property is not available for booking')
  }

  const maxGuests = room ? room.maxGuests : property.maxGuests
  if (input.guestCount > maxGuests) {
    throw new Error(`This option allows a maximum of ${maxGuests} guest(s)`)
  }

  if (nights < property.minNights) {
    throw new Error(`Minimum stay is ${property.minNights} night(s)`)
  }

  if (nights > property.maxNights) {
    throw new Error(`Maximum stay is ${property.maxNights} night(s)`)
  }

  // Soft availability check (outside transaction — fast path)
  const available = input.roomId
    ? await checkRoomAvailability(input.roomId, checkIn, checkOut)
    : await checkAvailability(input.propertyId, checkIn, checkOut)

  if (!available) {
    throw new Error('The selected option is not available for these dates')
  }

  // Pricing calculation via pricingService (handles seasonal prices, weekend markup, long-stay discount)
  const pricing = await calculateTotalPrice(
    input.propertyId,
    input.roomId ?? null,
    checkIn,
    checkOut
  )

  const effectivePricePerNight = pricing.pricePerNight
  const totalPrice = pricing.totalPrice + property.cleaningFee + property.securityDeposit

  const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MINUTES * 60 * 1000)

  return db.$transaction(async (tx) => {
    // Hard availability re-check inside transaction 
    const conflict = await tx.booking.findFirst({
      where: {
        ...(input.roomId ? { roomId: input.roomId } : { propertyId: input.propertyId, roomId: null }),
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { id: true },
    })

    if (conflict) {
      throw new Error('The selected option is not available for these dates')
    }

    // Generate a unique confirmation code (up to 5 attempts on collision)
    let confirmationCode = generateConfirmationCode()
    let attempts = 0
    while (attempts < 5) {
      const exists = await tx.booking.findUnique({ where: { confirmationCode }, select: { id: true } })
      if (!exists) break
      attempts++
      confirmationCode = generateConfirmationCode()
    }

    const booking = await tx.booking.create({
      data: {
        propertyId: input.propertyId,
        roomId: input.roomId,
        confirmationCode,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        guestCount: input.guestCount,
        guestMessage: input.guestMessage,
        checkIn,
        checkOut,
        nights,
        pricePerNight: effectivePricePerNight,
        cleaningFee: property.cleaningFee,
        securityDeposit: property.securityDeposit,
        totalPrice,
        currency: property.currency,
        status: BookingStatus.PENDING,
        expiresAt,
        guestCountry: input.guestCountry,
        acceptedTerms: input.acceptedTerms ?? false,
        acceptedPrivacy: input.acceptedPrivacy ?? false,
        acceptedMarketing: input.acceptedMarketing ?? false,
        termsAcceptedAt: input.acceptedTerms ? new Date() : null,
      },
      select: BOOKING_SELECT,
    })

    // If booking entire place, block all other rooms
    if (room?.type === 'ENTIRE_PLACE') {
      await blockAllRoomsForDates(tx, input.propertyId, room.id, checkIn, checkOut)
    }

    return booking
  })
}

/**
 * Lists reservations with optional filters.
 */
export async function listReservations(filters: { propertyId?: string; guestEmail?: string; status?: BookingStatus }) {
  return db.booking.findMany({
    where: {
      ...(filters.propertyId && { propertyId: filters.propertyId }),
      ...(filters.guestEmail && { guestEmail: filters.guestEmail }),
      ...(filters.status && { status: filters.status }),
    },
    orderBy: { createdAt: 'desc' },
    select: BOOKING_SELECT,
  })
}

/**
 * Retrieves a reservation by ID with its details.
 */
export async function getReservation(id: string) {
  return db.booking.findUnique({
    where: { id },
    select: BOOKING_SELECT,
  })
}

/**
 * Confirms a reservation (after payment).
 */
export async function confirmReservation(id: string) {
  const reservation = await db.booking.update({
    where: { id },
    data: { status: BookingStatus.CONFIRMED },
    select: {
      id: true,
      propertyId: true,
      guestName: true,
    },
  })

  // Create notification for host
  const property = await db.property.findUnique({
    where: { id: reservation.propertyId },
    select: { ownerId: true, title: true }
  })

  if (property) {
    await db.notification.create({
      data: {
        userId: property.ownerId,
        title: 'Nova Reserva!',
        message: `${reservation.guestName} reservou ${property.title}.`,
        type: NotificationType.BOOKING_CONFIRMED,
        data: { bookingId: reservation.id }
      }
    })
  }

  return reservation
}

/**
 * Cancels a reservation.
 */
export async function cancelReservation(id: string) {
  const cancelled = await db.booking.update({
    where: { id },
    data: { status: BookingStatus.CANCELLED },
    select: { id: true }
  })

  return cancelled
}

/**
 * Updates a reservation's basic fields (status, notes, etc.)
 */
export async function updateReservation(id: string, data: any) {
  return db.booking.update({
    where: { id },
    data,
    select: BOOKING_SELECT,
  })
}

/**
 * Blocks all active rooms in a property for a date range, excluding one room.
 * Used when the entire place is booked.
 */
async function blockAllRoomsForDates(
  tx: any,
  propertyId: string,
  excludeRoomId: string,
  checkIn: Date,
  checkOut: Date
) {
  const rooms = await tx.room.findMany({
    where: {
      propertyId,
      id: { not: excludeRoomId },
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  // Create blocks for each room for each date in range
  const blocks = []
  const cursor = new Date(checkIn)
  while (cursor < checkOut) {
    for (const room of rooms) {
      blocks.push({
        roomId: room.id,
        date: new Date(cursor),
        reason: 'Entire place booked',
      })
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  if (blocks.length > 0) {
    await tx.roomBlockedDate.createMany({
      data: blocks,
    })
  }
}
