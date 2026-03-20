import { BookingStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { isDateOverlap, normalizeDate } from '@/lib/date'

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
]

/**
 * Checks whether a property is available for the given date range.
 * If property hasRooms is true, it checks if at least one room is available.
 */
export async function checkAvailability(
  propertyId: string,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)

  const property = await db.property.findUnique({
    where: { id: propertyId, status: 'ACTIVE' },
    select: { hasRooms: true },
  })

  if (!property) return false

  // If property has rooms, it's available if at least one room is available
  if (property.hasRooms) {
    const activeRooms = await db.room.findMany({
      where: { propertyId, status: 'ACTIVE' },
      select: { id: true },
    })

    if (activeRooms.length === 0) return false

    // Check if any room is available
    const availabilityResults = await Promise.all(
      activeRooms.map((room) => checkRoomAvailability(room.id, start, end)),
    )

    return availabilityResults.some((available) => available)
  }

  // Legacy/Standard property-level check
  return db.$transaction(async (tx) => {
    const activeBookings = await tx.booking.findMany({
      where: {
        propertyId,
        roomId: null,
        status: { in: ACTIVE_STATUSES },
      },
      select: { checkIn: true, checkOut: true },
    })

    const hasConflict = activeBookings.some(({ checkIn, checkOut }) =>
      isDateOverlap(normalizeDate(checkIn), normalizeDate(checkOut), start, end),
    )

    if (hasConflict) return false

    const blockedDate = await tx.blockedDate.findFirst({
      where: {
        propertyId,
        date: { gte: start, lt: end },
      },
      select: { id: true },
    })

    return blockedDate === null
  })
}

/**
 * Checks whether a specific room is available for the given date range.
 */
export async function checkRoomAvailability(
  roomId: string,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  const start = normalizeDate(startDate)
  const end = normalizeDate(endDate)

  return db.$transaction(async (tx) => {
    const activeBookings = await tx.booking.findMany({
      where: {
        roomId,
        status: { in: ACTIVE_STATUSES },
      },
      select: { checkIn: true, checkOut: true },
    })

    const hasConflict = activeBookings.some(({ checkIn, checkOut }) =>
      isDateOverlap(normalizeDate(checkIn), normalizeDate(checkOut), start, end),
    )

    if (hasConflict) return false

    const blockedDate = await tx.roomBlockedDate.findFirst({
      where: {
        roomId,
        date: { gte: start, lt: end },
      },
      select: { id: true },
    })

    return blockedDate === null
  })
}

/**
 * Returns all dates on which the room is unavailable.
 */
export async function getUnavailableDatesForRoom(roomId: string): Promise<Date[]> {
  const [activeBookings, blockedDates] = await Promise.all([
    db.booking.findMany({
      where: {
        roomId,
        status: { in: ACTIVE_STATUSES },
      },
      select: { checkIn: true, checkOut: true },
    }),
    db.roomBlockedDate.findMany({
      where: { roomId },
      select: { date: true },
    }),
  ])

  const dateSet = new Set<string>()

  for (const { checkIn, checkOut } of activeBookings) {
    const cursor = normalizeDate(checkIn)
    const end = normalizeDate(checkOut)

    while (cursor < end) {
      dateSet.add(cursor.toISOString())
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  for (const { date } of blockedDates) {
    dateSet.add(normalizeDate(date).toISOString())
  }

  return Array.from(dateSet)
    .map((iso) => new Date(iso))
    .sort((a, b) => a.getTime() - b.getTime())
}

/**
 * Returns all dates on which the property is unavailable.
 */
export async function getUnavailableDates(propertyId: string): Promise<Date[]> {
  const [activeBookings, blockedDates] = await Promise.all([
    db.booking.findMany({
      where: {
        propertyId,
        roomId: null, // Only property-level bookings
        status: { in: ACTIVE_STATUSES },
      },
      select: { checkIn: true, checkOut: true },
    }),
    db.blockedDate.findMany({
      where: { propertyId },
      select: { date: true },
    }),
  ])

  const dateSet = new Set<string>()

  for (const { checkIn, checkOut } of activeBookings) {
    const cursor = normalizeDate(checkIn)
    const end = normalizeDate(checkOut)

    while (cursor < end) {
      dateSet.add(cursor.toISOString())
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  for (const { date } of blockedDates) {
    dateSet.add(normalizeDate(date).toISOString())
  }

  return Array.from(dateSet)
    .map((iso) => new Date(iso))
    .sort((a, b) => a.getTime() - b.getTime())
}
