import { db } from '@/shared/lib/db'
import { BookingStatus } from '@prisma/client'
import type { GuestBooking } from '@/domains/booking/types'

/** Fields exposed to guests — never includes ownerId, owner data, paymentIntentId, ownerNotes */
const guestBookingSelect = {
  id: true,
  confirmationCode: true,
  guestName: true,
  guestEmail: true,
  guestCount: true,
  checkIn: true,
  checkOut: true,
  nights: true,
  pricePerNight: true,
  cleaningFee: true,
  securityDeposit: true,
  totalPrice: true,
  discountAmount: true,
  currency: true,
  status: true,
  paymentStatus: true,
  source: true,
  guestMessage: true,
  property: {
    select: {
      title: true,
      address: true,
      city: true,
      country: true,
      checkInTime: true,
      checkOutTime: true,
      cancellationPolicy: true,
      images: {
        where: { isCover: true },
        take: 1,
        select: { url: true, publicId: true, alt: true },
      },
    },
  },
  room: {
    select: { name: true, type: true },
  },
} as const

export type { GuestBooking }

/**
 * Finds a single booking by confirmation code.
 * Used for guest portal code-based access.
 */
export async function findGuestBookingByCode(
  code: string
): Promise<GuestBooking | null> {
  return db.booking.findUnique({
    where: { confirmationCode: code },
    select: guestBookingSelect,
  }) as Promise<GuestBooking | null>
}

/**
 * Finds all bookings for a guest email.
 * Excludes CANCELLED bookings.
 */
export async function findGuestBookingsByEmail(
  email: string
): Promise<GuestBooking[]> {
  return db.booking.findMany({
    where: {
      guestEmail: { equals: email, mode: 'insensitive' },
      status: { notIn: [BookingStatus.CANCELLED] },
    },
    select: guestBookingSelect,
    orderBy: { checkIn: 'desc' },
  }) as Promise<GuestBooking[]>
}

/**
 * Finds a booking by internal ID.
 * Used for single-booking detail endpoints.
 */
export async function findGuestBookingById(
  id: string
): Promise<GuestBooking | null> {
  return db.booking.findUnique({
    where: { id },
    select: guestBookingSelect,
  }) as Promise<GuestBooking | null>
}

/**
 * Records a guest access event in the audit log.
 * Failures are non-fatal and only logged to console.
 */
export async function logGuestAccess(data: {
  email: string
  confirmationCode?: string
  bookingId: string
  ipAddress?: string
}): Promise<void> {
  await db.guestAccess
    .create({ data })
    .catch((err) => console.error('[GuestService] logGuestAccess failed', err))
}
