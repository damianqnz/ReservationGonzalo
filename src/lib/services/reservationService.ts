import { BookingStatus, PaymentStatus, PropertyStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { nightsBetween, normalizeDate } from '@/lib/date'
import { checkAvailability } from '@/services/availabilityService'

// ─── Constants ───────────────────────────────────────────────────────────────

const LONG_STAY_MIN_NIGHTS = 7
const LONG_STAY_DISCOUNT_RATE = 0.1
const PENDING_EXPIRY_MINUTES = 15
const CANCELLABLE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
]

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateReservationInput {
  propertyId: string
  checkIn: Date
  checkOut: Date
  guestName: string
  guestEmail: string
  guestPhone?: string
  guestCount: number
  guestMessage?: string
}

// ─── Shared select (never exposes hashedPassword or owner PII) ───────────────

const BOOKING_SELECT = {
  id: true,
  confirmationCode: true,
  guestName: true,
  guestEmail: true,
  guestPhone: true,
  guestCount: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  pricePerNight: true,
  cleaningFee: true,
  securityDeposit: true,
  totalPrice: true,
  currency: true,
  status: true,
  paymentStatus: true,
  paymentIntentId: true,
  guestMessage: true,
  source: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
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
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generates a unique confirmation code in RG-XXXXXX format
 * using 6 uppercase alphanumeric characters.
 */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `RG-${suffix}`
}

// ─── Service functions ───────────────────────────────────────────────────────

/**
 * Creates a new PENDING reservation for the given property and date range.
 *
 * Steps:
 * 1. Normalise dates and calculate nights
 * 2. Verify property exists, is ACTIVE, and accepts the guest count
 * 3. Soft-check availability (fast path before entering transaction)
 * 4. Calculate pricing: base × nights, 10% discount if nights >= 7, + fees
 * 5. Inside a Prisma transaction: re-check availability to prevent race
 *    conditions, generate unique RG-XXXXXX code, create booking with expiresAt
 *
 * @throws {Error} If property not found, inactive, dates invalid, unavailable,
 *   or guest count exceeds property maximum.
 */
export async function createReservation(input: CreateReservationInput) {
  const checkIn = normalizeDate(input.checkIn)
  const checkOut = normalizeDate(input.checkOut)
  const nights = nightsBetween(checkIn, checkOut)

  // Fetch property pricing constraints
  const property = await db.property.findUnique({
    where: { id: input.propertyId },
    select: {
      id: true,
      status: true,
      maxGuests: true,
      pricePerNight: true,
      cleaningFee: true,
      securityDeposit: true,
      currency: true,
      minNights: true,
      maxNights: true,
    },
  })

  if (!property) {
    throw new Error('Property not found')
  }

  if (property.status !== PropertyStatus.ACTIVE) {
    throw new Error('Property is not available for booking')
  }

  if (input.guestCount > property.maxGuests) {
    throw new Error(`Property allows a maximum of ${property.maxGuests} guest(s)`)
  }

  if (nights < property.minNights) {
    throw new Error(`Minimum stay is ${property.minNights} night(s)`)
  }

  if (nights > property.maxNights) {
    throw new Error(`Maximum stay is ${property.maxNights} night(s)`)
  }

  // Soft availability check (outside transaction — fast path)
  const available = await checkAvailability(input.propertyId, checkIn, checkOut)
  if (!available) {
    throw new Error('Property is not available for the selected dates')
  }

  // Pricing calculation
  const effectivePricePerNight =
    nights >= LONG_STAY_MIN_NIGHTS
      ? property.pricePerNight * (1 - LONG_STAY_DISCOUNT_RATE)
      : property.pricePerNight

  const totalPrice =
    effectivePricePerNight * nights + property.cleaningFee + property.securityDeposit

  const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MINUTES * 60 * 1000)

  return db.$transaction(async (tx) => {
    // Hard availability re-check inside transaction to prevent race conditions
    const conflict = await tx.booking.findFirst({
      where: {
        propertyId: input.propertyId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { id: true },
    })

    if (conflict) {
      throw new Error('Property is not available for the selected dates')
    }

    // Generate a unique confirmation code (up to 5 attempts on collision)
    let confirmationCode = generateConfirmationCode()
    for (let attempt = 1; attempt < 5; attempt++) {
      const taken = await tx.booking.findUnique({
        where: { confirmationCode },
        select: { id: true },
      })
      if (!taken) break
      confirmationCode = generateConfirmationCode()
    }

    return tx.booking.create({
      data: {
        propertyId: input.propertyId,
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
      },
      select: BOOKING_SELECT,
    })
  })
}

/**
 * Returns a reservation by its internal ID.
 * Includes property info and cover image. Never exposes hashedPassword.
 *
 * @returns The booking or null if not found.
 */
export async function getReservationById(id: string) {
  return db.booking.findUnique({
    where: { id },
    select: BOOKING_SELECT,
  })
}

/**
 * Returns a reservation by its confirmation code (RG-XXXXXX format).
 * Same shape as getReservationById.
 *
 * @returns The booking or null if not found.
 */
export async function getReservationByCode(code: string) {
  return db.booking.findUnique({
    where: { confirmationCode: code },
    select: BOOKING_SELECT,
  })
}

/**
 * Expires all PENDING reservations whose expiresAt timestamp is in the past.
 * Sets their status to CANCELLED.
 *
 * @returns The number of reservations that were expired.
 */
export async function expirePendingReservations(): Promise<number> {
  const result = await db.booking.updateMany({
    where: {
      status: BookingStatus.PENDING,
      expiresAt: { lt: new Date() },
    },
    data: {
      status: BookingStatus.CANCELLED,
    },
  })

  return result.count
}

/**
 * Returns a paginated list of reservations, optionally filtered by status.
 * Ordered by createdAt descending. Includes property info.
 *
 * @param input - Optional filters: status, page (default 1), limit (default 20, max 100).
 */
export async function listReservations(input: {
  status?: BookingStatus
  page?: number
  limit?: number
} = {}) {
  const page = Math.max(1, input.page ?? 1)
  const limit = Math.min(100, Math.max(1, input.limit ?? 20))
  const skip = (page - 1) * limit
  const where = input.status ? { status: input.status } : {}

  const [items, total] = await db.$transaction([
    db.booking.findMany({
      where,
      select: BOOKING_SELECT,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.booking.count({ where }),
  ])

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Updates owner-controlled fields on a reservation.
 * If status is set to CANCELLED, delegates to cancelReservation() which
 * enforces cancellable-state rules and handles REFUNDED paymentStatus.
 * For all other status changes, updates the fields directly.
 *
 * @param id - Booking ID.
 * @param data - Fields to update: status, ownerNotes, paymentStatus.
 * @throws {Error} If the reservation is not found or the transition is invalid.
 */
export async function updateReservation(
  id: string,
  data: {
    status?: BookingStatus
    ownerNotes?: string
    paymentStatus?: PaymentStatus
  },
) {
  if (data.status === BookingStatus.CANCELLED) {
    return cancelReservation(id, data.ownerNotes)
  }

  const existing = await db.booking.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!existing) {
    throw new Error('Reservation not found')
  }

  return db.booking.update({
    where: { id },
    data: {
      ...(data.status != null && { status: data.status }),
      ...(data.ownerNotes != null && { ownerNotes: data.ownerNotes }),
      ...(data.paymentStatus != null && { paymentStatus: data.paymentStatus }),
    },
    select: BOOKING_SELECT,
  })
}

/**
 * Cancels a reservation by ID.
 * Only PENDING or CONFIRMED reservations can be cancelled.
 * If the booking was PAID, automatically sets paymentStatus to REFUNDED.
 *
 * @param id - Booking ID
 * @param reason - Optional cancellation reason, stored in ownerNotes.
 * @throws {Error} If the reservation is not found or cannot be cancelled.
 */
export async function cancelReservation(id: string, reason?: string) {
  const booking = await db.booking.findUnique({
    where: { id },
    select: { id: true, status: true, paymentStatus: true },
  })

  if (!booking) {
    throw new Error('Reservation not found')
  }

  if (!CANCELLABLE_STATUSES.includes(booking.status)) {
    throw new Error(`Cannot cancel a reservation with status ${booking.status}`)
  }

  const isRefundable = booking.paymentStatus === PaymentStatus.PAID

  return db.booking.update({
    where: { id },
    data: {
      status: BookingStatus.CANCELLED,
      ...(isRefundable && { paymentStatus: PaymentStatus.REFUNDED }),
      ...(reason != null && { ownerNotes: reason }),
    },
    select: BOOKING_SELECT,
  })
}
